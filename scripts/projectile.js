/**
 * @author Petrus J Pretorius
 */
var projParticleData = {};
initProjectileParticleGeom = function() {
    projParticleData.geometry = new THREE.Geometry();
    var vector;
    for( i = 0; i < 50; i++) {
        x = (Math.random() - 0.5) * 50;
        y = (Math.random() - 0.5) * 50;
        z = (Math.random() - 0.5) * 50;
        vector = new THREE.Vector3(x, y, z);
        projParticleData.geometry.vertices.push(new THREE.Vertex(vector));

    }
    //make a small white square
    var canvas = $('<canvas/>')[0];
    canvas.width = 16;
    canvas.height = 16;
    context = canvas.getContext('2d');
    context.fillStyle = 'rgb(255,255,255)';
    context.fillRect(0, 0, 15, 15);

    projParticleData.map = new THREE.Texture(canvas);
    projParticleData.map.needsUpdate = true;

}
var projParticleSystems = [];
makeProjParticleImpact = function(color, pos, dir) {
    console.assert(color);
    console.assert(pos);
    console.assert(dir);

    var material = new THREE.ParticleBasicMaterial({
        size : 10,
        blending : THREE.AdditiveBlending,
        depthTest : true,
        transparent : true,
        map : projParticleData.map
    });
    material.color.setHSV(color[0], color[1], color[2]);

    var particles = new THREE.ParticleSystem(projParticleData.geometry, material);
    particles.position.copy(pos);
    particles.position.z = currentTile.getHeight(particles.position.x, particles.position.y) + 50;
    particles._timeToLive = 1;
    particles._dir = dir;
    projParticleSystems.push(particles);
    scene.add(particles);
}
animateProjParticles = function(timeDiff) {
    for(var i = 0, particles; particles = projParticleSystems[i]; i++) {
        if(particles._timeToLive < 0) {
            scene.remove(particles);
            delete particles;
            projParticleSystems.splice(i, 1);
            i--;
        } else {
            particles._timeToLive -= timeDiff;
            var fact = (particles._timeToLive - 1);
            particles.scale.set(fact, fact, fact);
            //particles.position.addSelf(particles._dir);
            particles.material.opacity = (1 - fact) ;
        }

    }
}
projectiles = [];
Projectile = function(shooter, charChar, origin, dir) {
    console.assert(shooter);
    this.shooter = shooter;
    console.assert(charChar);
    console.assert(origin);
    console.assert(dir);

    //this.color = params.color!==undefined?params.color:[0.2,0.7,0.7];
    this.code = charChar.charCodeAt(0);

    this.position = new THREE.Vector3().copy(origin);

    //RPG-style-stats for the loot.
    this.ammo = ammoClasses[charChar];
    console.assert(this.ammo);
    if(this.ammo.size === undefined)
        this.ammo.size = 30;
    //graphics
    this.sprite = makeSprite(this.code, this.ammo.size, [0, 0, 1], [this.position.x, this.position.y, currentTile.getHeight(this.position.x, this.position.y) + 50]);

    var rot = Math.acos(dir.x);
    if(dir.y < 0)
        rot = -rot;
    this.sprite.rotation = rot + Math.PI / 2;

    scene.add(this.sprite);

    projectiles.push(this);
    this._spd = calcStat(0.5, this.ammo.spd) * 30;
    this._dir = dir;
    this._v = new THREE.Vector3().copy(dir).multiplyScalar(this._spd);
    this._timeToLive = 3;
    //TODO: this can be initiated with weapon params... making short lived slow-moving flamethrower type weapons...

}

Projectile.prototype = new Object();
Projectile.prototype.constructor = Projectile;

Projectile.prototype.remove = function() {
    scene.remove(this.sprite);
    var ind = projectiles.indexOf(this);
    projectiles.splice(ind, 1);
    delete this;
}

Projectile.prototype.getPos = function() {
    return this.position;
}

Projectile.prototype.tick = function(timeDiff) {
    var dp = calcStat(0.5, this.ammo.dp) + this.shooter.getWStat('dp');
    var pos = this.getPos();
    var dir = this._dir;
    var thisProj = this;
    var hit;
    //var dir = new THREE.Vector3().copy(this._v);//.normalize();

    //try hit characters
    for(var i = 0, obj; obj = spawnedCharacters[i]; i++) {
        if(!obj.dead && (obj !== this.shooter)) {
            hit = hitLineSeg(function() {
                obj.takeHit(dir, dp);

                thisProj.remove();
            }, pos, dir, obj.position, obj.size, this._spd * timeDiff);
            //+ this.ammo.size);
            if(hit)
                continue;
        }
    }
    //try hit structures.
    this.sprite.position.set(pos.x, pos.y, currentTile.getHeight(pos.x, pos.y) + 50);
    //tile height cheat for projectiles...
    var ray = new THREE.Ray(this.sprite.position, dir);
    var intersects = ray.intersectObjects(currentTile.structures);

    for(var i = 0, intersect; intersect = intersects[i]; i++) {
        hit = hitLineSeg(function() {
            makeProjParticleImpact([0, 0, 0.5], pos, dir);
            thisProj.remove();
        }, pos, dir, intersect.point, 1, this._spd * timeDiff);
        // + this.ammo.size);
        if(hit)
            continue;
    }
    pos.addSelf(new THREE.Vector3().copy(this._v).multiplyScalar(timeDiff));

}
//projectile sim-tick
tickProjectiles = function(timeDiff) {
    for(var i = 0, proj; proj = projectiles[i]; i++) {
        if(proj._timeToLive < 0) {
            proj.remove();
            i--;
        } else {
            proj.tick(timeDiff);
            proj._timeToLive -= timeDiff;
        }

    }
}