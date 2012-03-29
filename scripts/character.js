/**
 * @author Petrus J Pretorius
 */
// default behaviours for characters
defaultBehaviours = {

    idle:function(timeDiff){

         if(this.timeToChill < 0){
            this.timeToChill = ~~(Math.random()*2+1);//1-3s
            //console.log('Chill out time over.:'+this.lastTime);
             //decide what to do:
             for(var i = 0 , c; c = spawnedCharacters[i];i++)
             {
                //ignore own team...
                if(c.team!==this.team&&!c.dead)
                {
                    var pos = c.getPos();
                    var dist = new THREE.Vector2().sub(pos,this.getPos());
                    if(dist.length()<500)
                    {
                        this.target = c;
                        this.charState = charStates.engage;
                        return;
                    }
                }

             }

            if(Math.random()>0.01){//simple roll
                var pos = this.getPos();
                this.movetarget = new THREE.Vector2(pos.x+(Math.random() - 0.5)*100,pos.y+(Math.random() - 0.5)*100);
                this.charState = charStates.moveTo;
                return;
            }
        }
        else{
            this.lastTime += timeDiff;
            this.timeToChill-=timeDiff;
        }
    },
    moveTo:function(timeDiff){
         var dist = this.movetarget.distanceTo(this.getPos());
         if(dist<40){
            //console.log('Phew! I finally got there! Time TO Chill out! time.:'+this.lastTime);
            this.movetarget = undefined;
            this.charState = charStates.idle;
            return;
         }
         var v = new THREE.Vector3().sub(this.movetarget,this.getPos());
         v.z = 0;
         this.move(v);
    },
    engage:function(timeDiff){
        if(this.target===undefined){
            this.charState = charStates.idle;
            return;
        }
        //ai can only target characters
        console.assert(this.target instanceof Character);
        if(this.target.dead)
        {
            this.target = undefined;
            return;
        }
        var vTarget = this.getTargetPos();

        var v = new THREE.Vector3().sub(vTarget,this.getPos());
        v.z = 0;
        var dist = vTarget.distanceTo(this.getPos());
        if(dist<(this.size+this.target.size)*0.707){
            //ATTACK!!!
            this.attack = true;
        }
        else
        {
            this.attack = false;
        }
        this.move(v);
    },
    flee:function(timeDiff){
    },

}

charStates = {
    idle:{live:defaultBehaviours.idle},
    moveTo:{live:defaultBehaviours.moveTo},
    engage:{live:defaultBehaviours.engage},
    flee:{live:defaultBehaviours.flee},
}

//The Character object
Character = function(scene, params, initStats)
{
    THREE.Object3D.call( this );
    //params
    if(params===undefined) var params ={};

    this.color = params.color!==undefined?params.color:[0.5,0.5,0.5];
	this.code = params.code!==undefined?params.code:('z').charCodeAt(0);
	this.size = params.size!==undefined?params.size:30;
    this.team = params.team;
    if(teamLoot[this.team]===undefined) teamLoot[this.team] = {};

    var pos = params.pos!==undefined?params.pos:[(Math.random() - 0.5)*ARENA_WIDTH, (Math.random() - 0.5)*ARENA_HEIGHT];
    if(pos[2]===undefined) pos[2] = currentTile.getHeight(pos[0],pos[1])+50;
    this.position.set( pos[0],
                       pos[1],
                       pos[2]);

    //RPG-stats
    this.creatureClass = creatureClasses[String.fromCharCode(this.code)];
    if(this.creatureClass===undefined)
    {
        this.code = ('z').charCodeAt(0);
        console.error('That character doesn\'t exist... yet. Reverting to zombie.');
        this.creatureClass = creatureClasses['d'];
    }

    if(initStats===undefined) var initStats ={};
    if(initStats.hp===undefined)  initStats.hp =0.5+Math.random()*0.5;
    if(initStats.dex===undefined)  initStats.dex =0.5+Math.random()*0.5;
    if(initStats.str===undefined)  initStats.str =0.5+Math.random()*0.5;
    if(initStats.spd===undefined)  initStats.spd =0.5+Math.random()*0.5;

    this.charState = params.charState !== undefined ? charStates[params.charState] : undefined ;
    this.lastTime =0;
    this.timeToChill = ~~(Math.random()*10);//the beat of life, with these, the creature shall live.

    this.statMods = initStats;
    this.baseClass = creatureClasses[String.fromCharCode(this.code)];

    this.HP = this.getStat('hp');//init hit points.

    //graphics
    this.sprite = makeSprite(this.code,this.size,this.color);
    this.add( this.sprite );
    this.geom = new THREE.SphereGeometry(params.size/2, 4, 4);
    this.sObj = new THREE.Mesh(this.geom , shadowMaterial );
    this.sObj.castShadow = true;

    this.add( this.sObj );
    scene.add( this );

    //physics
    scene.phys.bindMesh(this, {
    	geometry	: this.geom,
    	physics		: {
    		restitution	: 0.1
    	}
    });
    this._vphyBody.character = this;//bind the character to the physics body...(for identificatoin on contact)
    /*this.connectedChars = [];
    this.getBody().events.on('contact', function(type,otherBody){
        if(otherBody.character!==undefined)
        {
            if(this.character.connectedChars.indexOf(otherBody.character)===-1)
                this.character.connectedChars.push( otherBody.character);
        }

	});*/

    this.attack = false;
    this.attackTimeout = 0.0;
    this.wepExt = 1;
    this.dead = false;
    this.updateEffectiveness();
    this._prevRot = 0;
    this._prevExt = this.wepExt;
}

Character.prototype = new THREE.Object3D();
Character.prototype.constructor = Character;

Character.prototype.pickUp = function(someLoot)
{
    if(teamLoot[this.team][someLoot.code]===undefined) teamLoot[this.team][someLoot.code] = {q:0,type:0};
    if(someLoot.lootClass==LOOTCLASSES.pickup){
        teamLoot[this.team][someLoot.code].q += 1;
        return;
    }
    if(someLoot.lootClass===LOOTCLASSES.weapon){
        if(this.baseClass.arm===undefined||this.baseClass.arm){

           
            if(this.weapon === undefined || this.weapon.code === this.baseClass.defWep.charCodeAt(0)) {//if no weapon or default weapon
                //just pick it up and arm it..
                this.setWeapon(String.fromCharCode(someLoot.code));
            } else {
                this.disArm();
                //stash what we have...
                this.setWeapon(String.fromCharCode(someLoot.code));
            }

        }
    }else{
        //stick it in the loot
        teamLoot[this.team][someLoot.code].q += 1;
    }
    if(someLoot.lootClass==LOOTCLASSES.armour){
    }

    if(this.pickUpCB){
        this.pickUpCB(someLoot);
    }

}

Character.prototype.getWeaponSelection = function()
{
    teamLoot[this.team]
}

Character.prototype.getBody = function()
{
    return this._vphyBody;
}



Character.prototype.getStat = function(stat)
{
    if(this.baseClass.stats[stat]===undefined)
        return undefined;
    return calcStat(this.statMods[stat],this.baseClass.stats[stat]);//.M-this.baseClass.stats[stat].m)+this.baseClass.stats[stat].m;
}

Character.prototype.getWStat = function(stat)
{
    if(this.weapon===undefined||this.weapon.data[stat]===undefined)
        return undefined;
    if(this.statMods[this.weapon]===undefined) {
        this.statMods[this.weapon] = {};
    }
    if(this.statMods[this.weapon][stat]===undefined) {
        this.statMods[this.weapon][stat] = 0;
    }
    return calcStat(this.statMods[this.weapon][stat],this.weapon.data[stat]);//.M-this.weapon[stat].m)+this.weapon[stat].m;
}

Character.prototype.updateEffectiveness = function()
{
    var hp = this.getStat('hp');
    var effectiveness = this.HP/hp;
    this.effectiveness = Math.sqrt(effectiveness);
}

Character.prototype.move = function(dir)
{
    var body = this.getBody();
    var timeStep = scene.phys._timeStep*1000;
    var vel = body.getVelocity();
    var vvel = new THREE.Vector3(vel[0],vel[1],vel[2]);
    var currSpd = vvel.length();
    //console.log(currSpd);

    if(dir.length()==0)
    {
        var dragA = vvel.multiplyScalar(-currSpd*timeStep);
        body.accelerate(dragA.x,dragA.z,dragA.z);
    }
    else
    {
        var speed = this.getStat('spd');
        var speedCoeff = (speed*this.effectiveness-currSpd)*timeStep;
        dir.normalize();
        body.accelerate(dir.x*speedCoeff,dir.y*speedCoeff,dir.z*speedCoeff);
    }
}

Character.prototype.getPos = function(){
    return this.position;
}

Character.prototype.getTargetPos = function(){
    if(!this.target) return undefined;
    if(this.target instanceof THREE.Vector3)
    {
        return this.target;
    }
    else
    {
        console.assert(this.target instanceof Character);
        return this.target.getPos();
    }
}

Character.prototype.disArm = function(){
     //stick it in the loot
    if(!(this.weapon===undefined||this.weapon.code===this.baseClass.defWep.charCodeAt(0))){
        if(this.weapon.code) teamLoot[this.team][this.weapon.code].q += 1;
    }
    //clear
    this.weapon = undefined;
    if(this.weaponSprite){
        this.remove(this.weaponSprite);
    }
    this.weaponSprite = undefined;
    this.aimPoint=undefined;
}

Character.prototype.dropLoot = function(){
    if(!(this.weapon===undefined||this.weapon.code===this.baseClass.defWep.charCodeAt(0))){
        var pos = this.getPos();
        new LootItem(scene,{code:this.weapon.code,lootClass:LOOTCLASSES.weapon,pos:[pos.x,pos.y]});
        this.weapon.code = undefined;
    }
    this.disArm();
}

Character.prototype.setWeapon = function(WepChar){
    this.weapon = {};//make a new container for this character to store weapon data
    
    this.weapon.data = weaponClasses[WepChar];
    this.weapon.code = WepChar.charCodeAt(0);
    if(this.weapon.data.clip) this.weapon.currentClip = ~~(this.getWStat('clip'));
            
    if(this.weaponSprite) {
        this.remove(this.weaponSprite);
    }
    this.weaponSprite = makeSprite(this.weapon.code,this.weapon.data.size,[0,0,1],[0,0,10]);
    this.add(this.weaponSprite);
    if(this.aimPoint===undefined) this.aimPoint = new THREE.Vector3(Math.random()*200,Math.random()*200,Math.random()*200).addSelf(this.getPos());

}

Character.prototype.doAttack = function(timeDiff)
{
    //if no weapon, use hands/mouth/claws, whatever...
    if(this.weapon === undefined)
    {
        //set the default waepon..
        this.setWeapon(this.baseClass.defWep);//arm
        return;//but don't shoot yet...
    }
    console.assert(this.aimPoint);
    var dir = new THREE.Vector3().sub(this.aimPoint,this.getPos());
    dir.z = 0;
    dir.normalize();

    var fa=this.getWStat('fa');//check for firing accuracy... represents a projectile weapon.

    var fr = this.getWStat('fr');
    console.assert(fr);
    this.attackTimeout = 1/fr;

    if(fa!==undefined)
    {
        //get some ammo...
        var ammo = ammoClasses[this.weapon.data.ammo];

        if(this.weapon.data.clip){
            this.weapon.currentClip--;
            if(this.weapon.currentClip < 0){//reload
                this.attackTimeout = this.getWStat('rl');
                this.weapon.currentClip = ~~(this.getWStat('clip'));
                if(this.reloadCB) this.reloadCB();
            }
        }

        //adjust for firing accuracy...
        var dirWithFaAdj = new THREE.Vector3((Math.random()-0.5)*fa,(Math.random()-0.5)*fa,0);
        dirWithFaAdj.addSelf(dir).normalize();
        //shoot!
        new Projectile(this,this.weapon.data.ammo,this.getPos(),dirWithFaAdj);

        console.log("You shoot!");
    }

    this.wepExt = this.weapon.data.wepExt;
}

Character.prototype.takeHit = function(force,hp)
{

    this.HP -= hp;
    this.getBody().accelerate((force.x*hp)*1000,(force.y*hp)*1000,0);
    console.log("Ouch "+hp+" damage taken, "+this.HP+" HP left.");
    if(this.HP < 0)
    {
        console.log("I should be dead...");
        this.dead = true; //dead characters still hang around.
        this.dropLoot();
        this.color[1] = 0;
        this.sprite.color.setHSV(this.color[0],this.color[1],this.color[2]);
        var body = this.getBody();
        setTimeout(function(){
            body.remove(); //thier physics go
        }, 2000 );
    }
}

distanceToLine = function(origin,dir,p)//all THREE.Vector3()
{
    var a = new THREE.Vector3().sub(origin,p);
    var b = new THREE.Vector3().copy(dir).multiplyScalar( a.dot(dir) );
    var dist = new THREE.Vector3().sub(a,b);
    return dist.length();

}



Character.prototype.live = function(timeDiff)
{

    var body = this.getBody();

    if(body)
    {
        //universal drag
        var vel = body.getVelocity();
        var dragCoeff = 400;
        body.accelerate(-vel[0]*dragCoeff,-vel[1]*dragCoeff,-vel[2]*dragCoeff);
    }

    if(!this.dead){
        this.updateEffectiveness();
        if(this.charState) this.charState.live.call(this,timeDiff);

        //animate weapon sprite
        if(this.weaponSprite!==undefined&&this.target!==undefined){
            //update the aim point...
            var dex = this.getStat('dex');
            var vTarget = this.getTargetPos();
            var corr = new THREE.Vector3().sub(vTarget,this.aimPoint).multiplyScalar((dex*0.001));
            this.aimPoint.addSelf(corr);
            if(this===player) testSprite.position.copy(this.aimPoint);
            var aimDir = new THREE.Vector3().sub(this.aimPoint,this.getPos());
            aimDir.z = 0;
            aimDir.normalize();
            //draw the
            this.weaponSprite.position.copy(aimDir).multiplyScalar(this.size*this.wepExt/2);
            var rot = Math.acos(aimDir.x);
            if(aimDir.y<0) rot = -rot;
            var rotOffset = this.weapon.data.rotOffset!==undefined?this.weapon.data.rotOffset:0;
            this.weaponSprite.rotation = rot-Math.PI/2 + rotOffset;
            var dRot = rot - this._prevRot;
            this._prevRot = rot;
            var dExt = this.wepExt - this._prevExt;
            this._prevExt = this.wepExt;
            //while attacking... check arcsweep

     
            if(this.attack) {

                if(dExt > 0) {//check the weapon extention and hit test...
                    var dp = this.getWStat('dp') * this.effectiveness * dExt * (Math.sqrt(this.getStat('str') / 100) * 10 + 1);
                    var tDist;
                    var weaponExtent = (this.size * this.wepExt + this.weapon.data.size )/2;
                    
                    for(var i = 0, obj; obj = spawnedCharacters[i]; i++) {
                        //obj.sprite.color.setHSV(0,1,1);
                        if(obj != this) {
                            
                            hitLineSeg(function() {
                                obj.takeHit(aimDir, dp);
                            }, this.position, aimDir, obj.position, obj.size, weaponExtent);

                        }
                    }
                }
            }

        }

        //perform attack
        if(this.attackTimeout<=0.0)
        {
            if(this.attack)
            {
                this.doAttack(timeDiff);
            }
        }
        else
        {

            this.attackTimeout -= timeDiff;
        }
        this.wepExt -= (this.wepExt-0.5)*timeDiff;
    }



}