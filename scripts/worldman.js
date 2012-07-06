/**
 * @author Petrus J Pretorius
 */

var ARENA_GRID_WIDTH = 64,
    ARENA_GRID_HEIGHT = 64,
    ARENA_WIDTH = 2000,
    ARENA_HEIGHT = 2000;



var colorProfiles = {
    usual : {
        ambient : [64, 64, 64],
        sun : new THREE.Vector3(1, 1, 10),
        colors : [[66, 99, 155], [124, 64, 64], [255, 155, 99]],
        stops : [0, 0.1, 0.2]
    },
    hills : {
        ambient : [64, 64, 64],
        sun : new THREE.Vector3(1, 1, 10),
        colors : [[229, 200, 160], [255, 255, 255]],
        stops : [0, 0.5]
    },
};



var testMap = [
    [{smoothness:0.3,obstacles :[0,0],generator:{'g':0.5,'d':0.3,loot:{'$':200,')':7,'!':5,'1':1,'f':1}},captives:{'U':24},colorProfile:colorProfiles.usual,loot:{'$':200,')':3,'!':3}},0,0,0,0,0,0,0,],
    [0,0,0,0,0,0,0,0,],
    [0,0,0,0,0,0,0,0,],
    [0,0,0,0,0,0,0,0,],



];


TileBlock = function(id, params) {
    this.id = id;
    if(params === undefined || typeof (params) !== 'object')
        var params = {};
    var smoothness = params.smoothness !== undefined ? params.smoothness : 0.5;
    var depth = params.depth !== undefined ? params.depth : 440;
    this.obstacles = params.obstacles !== undefined ? params.obstacles : [0, 0];
    this.generator = params.gen !== undefined ? params.gen : {};
    this.captives = params.captives !== undefined ? params.captives : {};
    this.loot = params.loot !== undefined ? params.loot : {};
    var sun = (params.sun !== undefined) ? params.sun : new THREE.Vector3(1, 1, 1);

    this.tileData = WorldMan.generateHeightData(ARENA_GRID_WIDTH, ARENA_GRID_HEIGHT, {
        sun : sun,
        depth : depth,
        smoothness : smoothness,
        noiseSet : (this.id / 100.0)
    });
    this.TextureCanvas = WorldMan.generateTexture(this.tileData, ARENA_GRID_WIDTH, ARENA_GRID_HEIGHT, depth, params.colorProfile);
    this.texture = new THREE.Texture(this.TextureCanvas, new THREE.UVMapping(), THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
    this.texture.needsUpdate = true;

    var geometry = new THREE.PlaneGeometry(ARENA_WIDTH, ARENA_HEIGHT, ARENA_GRID_WIDTH - 1, ARENA_GRID_HEIGHT - 1);

    for(var vertex, i = 0; vertex = geometry.vertices[i]; i++) {

        vertex.y = this.tileData[i];

    }
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeTangents();

    this.tileMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
        map : this.texture,
        wireframe : false
    }));

    //this.tileMesh.castShadow = true;
    this.tileMesh.receiveShadow = true;

    this.structures = new Array();
    this.createStructures();
}


TileBlock.prototype = new Object();
TileBlock.prototype.constructor = TileBlock;

TileBlock.prototype.getHeight = function(x, y) {
    var X = ~~((x / ARENA_WIDTH + 0.5) * ARENA_GRID_WIDTH);
    var Y = ~~((-y / ARENA_HEIGHT + 0.5) * ARENA_GRID_HEIGHT);
    var i = Y * ARENA_GRID_WIDTH + X;
    return this.tileData[i];
}

TileBlock.prototype.createStructures = function() {
    var perlin = new ImprovedNoise();
    var noiseSet = this.id / 100.0;
    for(var i = 0; i < 5; i++) {

        var scale = (perlin.noise(i / 5, 0.5, noiseSet) + 0.5) * 3.0 + 2.0;
        var geometry = new THREE.CubeGeometry(40 * scale, 40 * scale, 40 * scale);

        var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
            color : 0xa08080
        }));

        object.material.ambient = object.material.color;

        object.position.x = (perlin.noise(i / 5, 0.5, noiseSet)) * 1000;
        object.position.y = (perlin.noise(0.5, i / 5, noiseSet)) * 1000;
        object.position.z = this.getHeight(object.position.x, object.position.y) + geometry.boundingSphere.radius / 2;

        object.castShadow = true;
        object.receiveShadow = true;
        scene.phys.bindMesh(object, {
            geometry : new THREE.CubeGeometry(40 * scale, 40 * scale, 1000),
            physics : {
                restitution : 0.3
            }
        });
        this.structures.push(object);
        scene.add(object);
    }
    //walls...
    this.addWalls();
}

TileBlock.prototype.addWallMesh = function(width, thickness, depth, x, y, z) {
    var geometry = new THREE.CubeGeometry(width, thickness, depth, 1, 1, 1, [], true);
    var material = new THREE.MeshBasicMaterial({
        color : 0xffaa00,
        wireframe : true
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    this.structures.push(mesh);
    scene.add(mesh);
    scene.phys.bindMesh(mesh, {
        physics : {
            restitution : 0.1
        }
    });
}

TileBlock.prototype.addWalls = function() {
    var thickness = 10;
    var width = ARENA_WIDTH;
    var height = ARENA_HEIGHT;
    var depth = 200;

    this.addWallMesh(width, thickness, depth, 0, height / 2, depth / 2);
    this.addWallMesh(width, thickness, depth, 0, -height / 2, depth / 2);
    this.addWallMesh(thickness, height, depth, width / 2, 0, depth / 2);
    this.addWallMesh(thickness, height, depth, -width / 2, 0, depth / 2);
    this.addWallMesh(width, height, thickness, 0, 0, 0);
    //floor

}

WorldMan = {

    generateHeightData : function(width, height, params) {

        if(params === undefined)
            var params = {};
        if(params.noiseSet === undefined)
            params.noiseSet = 1.0;
        if(params.smoothness === undefined)
            params.smoothness = 0.5;
        else
            params.smoothness = (params.smoothness > 1.0 ? 1.0 : (params.smoothness < 0.0 ? 0.0 : params.smoothness));
        if(params.layers === undefined)
            params.layers = ~~(10 * (1.0 - params.smoothness) + 1);
        if(params.depth === undefined)
            params.depth = 1.0;

        var q = 250 * params.smoothness;
        var size = width * height, data = new Float32Array(size);
        var perlin = new ImprovedNoise();

        for(var i = 0; i < size; i++) {
            data[i] = 0
        }

        for(var j = 0; j < params.layers; j++) {

            for(var i = 0; i < size; i++) {

                var x = i % width, y = ~~(i / width ), fact = (q * ((j + 1) / (params.layers + 1)));
                data[i] += Math.abs(perlin.noise(x / fact, y / fact, params.noiseSet)) * params.depth / params.layers;
            }

        }
        return data;
    },
    generateTexture : function(data, width, height, depth, params) {

        if(params === undefined)
            var params = {};

        if(params.sun === undefined)
            params.sun = new THREE.Vector3(2, 3, 8);
        if(params.ambient === undefined)
            params.ambient = [80, 80, 80];
        if(params.shadeFact === undefined)
            params.shadeFact = 0.001;
        if(params.colors === undefined)
            params.colors = [[66, 66, 0], [55, 155, 55], [255, 255, 255]];
        if(params.stops === undefined)
            params.stops = [0, 0.3, 0.8];

        var canvas, canvasScaled, context, image, imageData, level, diff, vector3, sun, shade, numStops = params.stops.length;
        vector3 = new THREE.Vector3(0, 0, 0);
        sun = params.sun;
        sun.normalize();
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, width, height);
        image = context.getImageData(0, 0, canvas.width, canvas.height);
        imageData = image.data;

        for(var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

            vector3.x = data[j - 1] - data[j + 1];

            vector3.y = -(data[j - width] - data[j + width]);
            vector3.z = 2;
            vector3.normalize();
            shade = vector3.dot(sun);
            shade = shade < params.shadeFact ? params.shadeFact : shade;
            shade = Math.sqrt(Math.sqrt(shade));

            var h = data[j];
            h /= depth;
            //normalize

            var colour;
            // = mapColour(h);

            //find in stops?
            if(numStops > 1) {

                for(var stop = 1; h > params.stops[stop]; stop++) {
                }
                colour = params.colors[stop - 1];
            } else {
                //use the first colour
                colour = params.colors[0];
            }

            imageData[i] = (params.ambient[0] + shade * colour[0] );
            imageData[i + 1] = (params.ambient[1] + shade * colour[1] );
            imageData[i + 2] = (params.ambient[2] + shade * colour[2] );
        }

        context.putImageData(image, 0, 0);

        // Scaled 4x

        canvasScaled = document.createElement('canvas');
        canvasScaled.width = width * 4;
        canvasScaled.height = height * 4;
        context = canvasScaled.getContext('2d');
        context.scale(4, 4);
        context.drawImage(canvas, 0, 0);
        image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
        imageData = image.data;

        for(var i = 0, l = imageData.length; i < l; i += 4) {

            var v = ~~(Math.random() * 5 );

            imageData[i] += v;
            imageData[i + 1] += v;
            imageData[i + 2] += v;

        }

        context.putImageData(image, 0, 0);

        return canvasScaled;

    },
}

