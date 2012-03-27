//utf-8 basic ASCII-like character set...
function makeCodeBuffer()
{
    var codeBuffer = [];
    var i;
    //make a list of interresting characters
    for( i = 33; i < 126 ; i++) codeBuffer.push(i);
    for( i = 161; i < 230 ; i++) codeBuffer.push(i);
    return codeBuffer;

}

//draws a character table to the canvas and returns object with some calculated info, like grid size... based on font info.
function ASCIITextSrc(params)
{
    if( params === undefined) var params = {};
    if( params.canvasSize === undefined) params.canvasSize = new THREE.Vector2(512,512);
    if( params.fontHeight === undefined) params.fontHeight = 24;
    if( params.fontFamily === undefined) params.fontFamily = 'monospace';
    if( params.fontMods === undefined) params.fontMods = 'bold';

    var canvas = document.createElement( 'canvas' );
    //var canvas = $('#ASCIICanvasRender')[0];

    var codeBuffer = makeCodeBuffer();

    canvas.width = params.canvasSize.x;
    canvas.height = params.canvasSize.y;

    var retObj = {UVOffSets:{}};

    var context = canvas.getContext( '2d' );
    //context.fillStyle = 'rgba(255,0,0,0.2)';
    //context.fillRect(0, 0, params.canvasSize.x, params.canvasSize.y);
    context.font = params.fontMods+' '+params.fontHeight+'px '+params.fontFamily;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = 'white';

    //var tW,fontWidth = 0;

    //find the fattest character to use for fontWidth
    /*for(i=0;i<codeBuffer.length;i++)
    {
        tW = context.measureText(String.fromCharCode(codeBuffer[i])).width;
        fontWidth = fontWidth < tW? tW : fontWidth;
    }*/


    var gridSize = new THREE.Vector2(params.fontHeight*1.2+2,params.fontHeight*1.2+2);

   // var rows = Math.floor(params.canvasSize.y/gridSize.y);
    var cols = Math.floor(params.canvasSize.x/gridSize.x);
    retObj.uvScale = new THREE.Vector2(gridSize.x/params.canvasSize.x , gridSize.y/params.canvasSize.y );
    retObj.canvasSize = params.canvasSize ;
    //draw the list to the canvas
    var offSet;
    for( var code,col,row,i = 0; code = codeBuffer[i] ; i++)
    {
        row = i%cols;
        col = Math.floor(i/cols);
        offSet = new THREE.Vector2(gridSize.x*(row) , gridSize.y*(col));
        context.fillText(String.fromCharCode(code), offSet.x +gridSize.x*0.5, offSet.y +gridSize.y*0.5);
        retObj.UVOffSets[code] = new THREE.Vector2(offSet.x/params.canvasSize.x,offSet.y/params.canvasSize.y);
    }


    retObj.gridSize = gridSize;
    retObj.cols = cols;
    retObj.map = new THREE.Texture( canvas );
    retObj.map.needsUpdate = true;
    retObj.codeBuffer = codeBuffer;
    return retObj;

}

makeSprite = function(code,size,color,pos)
{
    var sprite = new THREE.Sprite( { map: ASCIITexture.map, useScreenCoordinates: false, mergeWith3D: true } );
    //sprite.opacity = 0.9;
    //sprite.castShadow = true;
    sprite.uvOffset = ASCIITexture.UVOffSets[code];
    sprite.uvScale = ASCIITexture.uvScale;
    sprite.scale.set(size/ASCIITexture.canvasSize.x,size/ASCIITexture.canvasSize.y,1);

    sprite.color.setHSV( color[0], color[1], color[2] );

    if(pos)
	   sprite.position.set(  pos[0],
	                         pos[1],
	                         pos[2]);
    return sprite;
}


hitLineSeg = function(callback,origin,dir,tPos,tSize,lineLength){
    var tDist;
    //2d cheat
    var fakeOrigin = new THREE.Vector3().copy(origin);
    fakeOrigin.z = 0;
    var fakePos = new THREE.Vector3().copy(tPos);
    fakePos.z=0;

    tDist = distanceToLine(fakeOrigin,dir,fakePos);
    if(tDist<tSize/2){//1st HIT condition!!! object close to ray
        //obj.sprite.color.setHSV(0,0.5,1);
        tDist = new THREE.Vector3().sub(fakePos,fakeOrigin);
        if(dir.dot(tDist)>0){//2nd HIT condition!! object in front
            //obj.sprite.color.setHSV(0,0.2,1);
            tDist = tDist.length();
            if(tDist<(lineLength)){//final condition for melee...
                //obj.sprite.color.setHSV(0.2,1,1);
                callback();
                return true;
            }
        }
    }
    return false;
}