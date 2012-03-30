/**
 * @author Petrus J Pretorius
 */
//global objects
var stats,
    windowHalfX,
    windowHalfY,
    camera,
    projector,
    scene,
    theLoot=[],
    renderer,
    ASCIITexture,
    currentTile,
    spawnedCharacters = new Array(),
    player,
    worldMouse,
    shadowMaterial,
    mouseX = 0, mouseY = 0;
    paused = true;


//the keys
var keyMap = {};
var gameCntrls = ['left', 'right', 'up', 'down', 'attack'];
//default keys.
var gameKeys = [37, 39, 38, 40, 64];
//order matters, and need same amount as gameCntrls.
var cntrlMap = {};
//setup cntrlMap
(function() {
    for(var i = 0, cntrl; cntrl = gameCntrls[i]; i++) {
        cntrlMap[cntrl] = gameKeys[i];
    }
})();//to keep global scope clean... hahaha, I know. funny cos I'm messing it up so much.

checkKey = function(key)//todo: this can be expanded to deal with multiple bindings and not just keys. mouse buttons etc. also
{
    if(gameKeys.indexOf(key)==-1)
        return false;
    return true;
}

resizeRenderer = function() {
    var elmnt = $('#mainStage');
    windowHalfX = elmnt.innerWidth();
    windowHalfY = elmnt.innerHeight();
    if(renderer) {
        renderer.setSize(windowHalfX, windowHalfY);
    }
    if(camera) {
        camera.aspect = windowHalfX / windowHalfY;
        camera.updateProjectionMatrix();
    }
    windowHalfX *= 0.5;
    windowHalfY *= 0.5;
}

$(window).resize(resizeRenderer);

$(document).ready(function() {
    $('#loadingDIV').append('<br/>initializing Data...');
    window.setTimeout(function() {

        initGame();
        $('#loadingDIV').remove();
        requestAnimationFrame(animate);

    }, 20);
})

var playerWeapons = ['p'];
var currWeapon = 0;
playerPickUpCB = function(someLoot) {
    console.assert(someLoot);
    if(someLoot.lootClass === LOOTCLASSES.weapon) {
         var c = String.fromCharCode(someLoot.code);
        if(playerWeapons.indexOf(c)===-1){
            playerWeapons.push(c);
            playerWeapons.sort();
            updateWeaponSelect();
        }

    }
}

updateWeaponSelect = function() {
    var weaponSelect = $('#weaponSelect');
    var htmlStr = '';
    for(var i = 0,weapon; weapon = playerWeapons[i];i++){
        if(i===currWeapon){
            htmlStr += '<span class="currWeapon">'+ weapon + '</span> ';
        }else{
            htmlStr +=  weapon + ' ';
        }
    }
    weaponSelect.html(htmlStr);
    
    
}

mouseWheelEventHandler = function(event, delta, deltaX, deltaY) {
    if(playerWeapons.length){
        currWeapon += delta;
        currWeapon %= playerWeapons.length;
    
        if(currWeapon < 0) {
            currWeapon += playerWeapons.length;
        }

        player.setWeapon(playerWeapons[currWeapon]);
        updateWeaponSelect();
        if(player.weapon.currentClip) updateClipDisplay(player);
    }
    
}


function newGame(container) {
    if(!paused)
        paused = true;
    
    if(scene)
        delete scene;
    
    shadowMaterial = new THREE.MeshDepthMaterial({
        opacity : 0.0
    });
    //shadowMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) ;

    projector = new THREE.Projector();
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);
    camera = new THREE.PerspectiveCamera(75, container.innerWidth() / container.innerHeight(), 1, 2000);
    camera.position.z = 1000;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);
    projPlane = new THREE.Mesh(new THREE.PlaneGeometry(ARENA_WIDTH * 2, ARENA_HEIGHT * 2, 3, 3), new THREE.MeshBasicMaterial({
        color : 0xffffff,
        opacity : 0.8,
        transparent : true,
        wireframe : true
    }));
    projPlane.lookAt(camera.position);
    projPlane.visible = true;
    scene.add(projPlane);
    //addSun(scene);

    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(200, 300, 800);

    directionalLight.castShadow = true;
    directionalLight.shadowCameraLeft = -ARENA_WIDTH / 2;
    directionalLight.shadowCameraRight = ARENA_WIDTH / 2;
    directionalLight.shadowCameraTop = ARENA_HEIGHT / 2;
    directionalLight.shadowCameraBottom = -ARENA_HEIGHT / 2;
    directionalLight.shadowCameraNear = 150;
    directionalLight.shadowCameraFar = 2000;

    //directionalLight.shadowBias = -0.00022;
    directionalLight.shadowDarkness = 0.5;

    directionalLight.shadowMapWidth = 1024;
    directionalLight.shadowMapHeight = 1024;
    scene.add(directionalLight);

    scene.phys = new THREEx.Microphysics({
        //timeStep  : 1/120
    });

    //make the terrain...
    currentTile = new TileBlock(0,testMap[0][0]);

    scene.add(currentTile.tileMesh);
    directionalLight.target = currentTile.tileMesh;

    //init the character textrure source
    ASCIITexture = ASCIITextSrc();
    //init the sprites
    var teamColor = {
        'us' : [0.3, 1, 1],
        'them' : [0, 1, 1]
    };
    var teams = ["us", "them"];
    var numChars = ASCIITexture.codeBuffer.length;
    var spawnParams = new Array(numChars);
    for(var paramID = 0; paramID < 16; paramID++) {
        var team = 'them';
        //teams[~~(Math.random()*teams.length)];
        spawnParams[paramID] = {
            color : teamColor[team],
            code : (ASCIITexture.codeBuffer[Math.floor(Math.random() * numChars)]),
            size : Math.random() * 50 + 50,
            charState : 'idle', //for AI...
            team : team
        };
    }

    var uvScale = ASCIITexture.uvScale;

    for(var params, i = 0; params = spawnParams[i]; i++) {
        spawnedCharacters[i] = new Character(scene, params);

    }
    player = new Character(scene, {
        color : teamColor['us'],
        code : ('@').charCodeAt(0),
        size : 100,
        team : 'us'
    });

    spawnedCharacters[i] = player;
    player.pickUpCB = playerPickUpCB;

    scene.phys.world().add({
        type : vphy.types.ACCELERATOR,
        perform : function() {
            var a = new THREE.Vector3(0, 0, 0);
            if(keyMap[cntrlMap['right']])
                a.x += 1;
            if(keyMap[cntrlMap['left']])
                a.x -= 1;
            if(keyMap[cntrlMap['up']])
                a.y += 1;
            if(keyMap[cntrlMap['down']])
                a.y -= 1;
            if(!player.dead)
                player.move(a);
        }
    });

    // gravity
    gravity = new vphy.LinearAccelerator({
        x : 0,
        y : 0,
        z : -9.8 * (1 / scene.phys._timeStep),
    });

    scene.phys.world().add(gravity);

    scene.phys.start();

    //gui
    gui = new dat.GUI({
        height : 24
    });
    gui.close();
    gui.add(player.statMods, 'hp').min(0.01).max(0.99).step(0.05).name('Health points');
    gui.add(player.statMods, 'dex').min(0.01).max(0.99).step(0.05).name('Dexterity');
    gui.add(player.statMods, 'str').min(0.01).max(0.99).step(0.05).name('Strength');
    gui.add(player.statMods, 'spd').min(0.01).max(0.99).step(0.05).name('Speed');
    gui.add(player, 'effectiveness').listen();
    gui.add(player, 'HP').listen();
    //test sprite..
    testSprite = makeSprite(('*').charCodeAt(0), 100, [0, 0, 1], [0, 0, 400]);
    testSprite.mergeWith3D = false;
    scene.add(testSprite);

    //some test loot...
    testLoots = ['!', ')', 'f', 'F'];
    for(var i = 0; i < 10; i++) {
        theLoot.push(new LootItem(scene, {
            code : (testLoots[~~(Math.random() * testLoots.length)]).charCodeAt(0),
            lootClass : LOOTCLASSES.weapon
        }));

    }

    $('#playerClip').hide();
    paused = false;
    $('#mainMenu').hide();

}

var gui;

function initGame() {
    if(!Detector.webgl)
        Detector.addGetWebGLMessage();

    var container;
    //var particles, geometry;

    container = $('#mainStage');
    //$('body').append( container );

    renderer = new THREE.WebGLRenderer({
        clearAlpha : 1
    });

    resizeRenderer();
    //renderer.setSize( container.innerWidth(), container.innerHeight() );
    //renderer.shadowMapAutoUpdate = true;
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    //renderer.sortObjects = false;
    container.append(renderer.domElement);
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.append(stats.domElement);

    container.mousemove(onDocumentMouseMove);
    container.mousedown(onMouseDown);
    container.mouseup(onMouseUp);
    //so we can use the right click for game-play
    container.on('contextmenu', function() {
        return false;
    });

    $(document).keydown(function(e) {

        if(e.which === 27) {
            // $('#controlInput').blur();
            if(paused){
                if(camera){
                    paused = false;
                    $('#mainMenu').hide();   
                }
            } else {
                paused = true;
                $('#mainMenu').show();
            }
            
            return;
        }

        if(checkKey(e.which)) {
            keyMap[e.which] = true;
            e.preventDefault();
        }

    });

    $(document).keyup(function(e) {
        if(checkKey(e.which)) {
            keyMap[e.which] = false;
            e.preventDefault();
        }

    });
    
    $(container).mousewheel(mouseWheelEventHandler );


    //document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    //document.addEventListener( 'touchmove', onDocumentTouchMove, false );
    
    initProjectileParticleGeom();
    $('#startNew').click(function(){
        newGame(container);    
    });
    
    
    
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / windowHalfX;
    mouseY = -(event.clientY - windowHalfY) / windowHalfY;

}

function onMouseDown(event) {
    if(player) {
        player.attack = true;
        event.preventDefault();
        //console.log("mouse down");
    }
}


function onMouseUp(event) {
    if(player) {
        player.attack = false;
        event.preventDefault();
        //console.log("mouse up");
    }
}

updateClipDisplay = function(character)
{
    var clip = character.weapon.currentClip;
    console.assert(character.weapon.currentClip);
    var html = '';
    for(var i = 0 ; i < clip; i++) html += character.weapon.data.ammo;
    $('#playerClip').html(html);
}


animateWorld = function(timeDiff){
    scene.phys.update();
    tickProjectiles(timeDiff);
    animateProjParticles(timeDiff);  

    for(var character, i = 0; character = spawnedCharacters[i]; i++) {
        character.live(timeDiff);
    }


//update gui stuff...

    if(player.weapon && player.weapon.currentClip) {        
            if($('#playerClip:hidden')[0])
                $('#playerClip').show();
            if(player.weapon.lastClip === undefined)
                player.weapon.lastClip = player.weapon.currentClip + 1;
            if(player.weapon.lastClip !== player.weapon.currentClip) {
                updateClipDisplay(player);
                player.weapon.lastClip = player.weapon.currentClip;
            }
    } else {
        if($('#playerClip:visible')[0]) {
            $('#playerClip').hide();
        }
    };

    //correct for terrain cheat
    var pos;
    for(var character, i = 0; character = spawnedCharacters[i]; i++) {
        pos = character.getPos();
        pos.z = currentTile.getHeight(pos.x, pos.y) + (this.dead ? 60 : 50);
    }

} 

var prevTime = 0;
function animate(lastTime) {
    // update the time
    if(prevTime == 0)
        prevTime = lastTime;
    requestAnimationFrame(animate);
    var timeDiff = (lastTime - prevTime) / 1000.0;
    prevTime = lastTime;

    //update the mouse position...
    if(camera) {
        var vector = new THREE.Vector3(mouseX, mouseY, 0.0);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
        worldMouse = ray.intersectObject(projPlane)[0];

        if(worldMouse) {

            player.target = worldMouse.point;
        }

        if(!paused) {
            animateWorld(timeDiff);
        }
        
        render();
        stats.update();

    }

}

function render() {

    var i,j,h,obj,pos;
	//var time = Date.now() * 0.001;
    pos = player.getPos();
	camera.position.x += (  mouseX*ARENA_WIDTH*(0.13) - (camera.position.x - pos.x) ) * 7 * scene.phys._timeStep;
	camera.position.y += (  mouseY*ARENA_HEIGHT*(0.13) - (camera.position.y - pos.y ) ) * 7 * scene.phys._timeStep;

    var lookatPos = new THREE.Vector3((camera.position.x - pos.x),(camera.position.y - pos.y ),0).multiplyScalar(2.3);
    lookatPos.addSelf(pos);
    //lookatPos.addSelf(camera.position).multiplyScalar(0.7);
    //lookatPos.addSelf(player.sprite.position);
	//lookatPos.z = 0;
    camera.lookAt( lookatPos );

	renderer.render( scene, camera );

}

