/**
 * @author Petrus J Pretorius
 */
LOOTCLASSES = {//these are defined in things.js
    pickup:pickupClasses,
    weapon:weaponClasses,
    armour:armourClasses,
}

LootItem = function(scene, params)
{
    //params
    if(params===undefined) var params ={};

    this.color = params.color!==undefined?params.color:[0.2,0.7,0.7];
	this.code = params.code!==undefined?params.code:('$').charCodeAt(0);
    this.lootClass = params.lootClass!==undefined?params.lootClass:LOOTCLASSES.pickup;

    var pos = params.pos!==undefined?params.pos:[(Math.random() - 0.5)*ARENA_WIDTH, (Math.random() - 0.5)*ARENA_HEIGHT];
    if(pos[2]===undefined) pos[2] = currentTile.getHeight(pos[0],pos[1])+50;

    //RPG-style-stats for the loot.
    this.loot = this.lootClass[String.fromCharCode(this.code)];
    if(this.loot.size===undefined) this.loot.size = 30;
    if(this.loot===undefined)
    {
        this.code = ('$').charCodeAt(0);
        this.lootClass = LOOTCLASSES.pickup;
        console.error('That loot doesn\'t exist... yet. Reverting to money.');
        this.loot = this.lootClass['$'];
    }

    //graphics
    this.sprite = makeSprite(this.code,this.loot.size,this.color,pos);

    scene.add( this.sprite );

    //physicsTHREE.SphereGeometry(this.loot.size/2, 2, 2),geometry	= new
    scene.phys.bindMesh(this.sprite, {
    	geometry	: new  THREE.CubeGeometry(this.loot.size/2,this.loot.size/2,ARENA_WIDTH, 1, 1, 1, [], true),
    	physics		: {
    		restitution	: 0.01,
    	}
    });
    var thisLoot = this;
    this.sprite._vphyBody.dynamic = false;
    this.sprite._vphyBody.events.on('contact', function(type,otherBody){
        if(otherBody.character!==undefined&&!otherBody.character.dead)
        {
            //Pick me up!
            otherBody.character.pickUp(thisLoot);
            //die
            thisLoot.sprite._vphyBody.remove();
            scene.remove(thisLoot.sprite);
            delete thisLoot;
        }
	});
}

LootItem.prototype = new Object();
LootItem.prototype.constructor = LootItem;

teamLoot = {};