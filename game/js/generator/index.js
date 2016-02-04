var blockIds = require( "./blockIds" );
var defaultSkyColor = require( "../consts/colors" ).DEFAULT_SKY;
var tilemap = require('../consts/tilemap');

var GhostBreakBrickBlock = require('../objects/ghostBreakBrickBlock');

function LevelGenerator( levelData ) {

  if ( blockIds === undefined ) console.error( "blockIds are undefined (wtf!!)")

  this.blockIds = blockIds;
  this.levelData = levelData;

}

LevelGenerator.prototype.getSkyColor = function() {
  return this.levelData.sky || defaultSkyColor;
}

LevelGenerator.prototype.getStartingGirders = function() {
  return this.levelData.girders || 10;
}

LevelGenerator.prototype.parseObjects = function() {

  var levelObjects = [];
  var objDefList = this.levelData.objs;
  var blocks = this.blockIds;

  objDefList.forEach( function( objDef ) {

    // find the object definition function for this id
    var createFunction = undefined;
    if ( objDef.t !== undefined && blocks[ objDef.t ] !== undefined ) {
      createFunction = blocks[ objDef.t ].onLoad;

    } else {
      console.log( "[LVGN] No tile found for", objDef.t );
    }

    if ( typeof createFunction !== "function" ) {
      console.error( "Received an invalid object definition from mapdata:\n", JSON.stringify( objDef ) );
      return;
    }

    // create it!

    levelObjects.push( createFunction( objDef ) );

    // account for ghost mode
    if ( tilemap[objDef.t] === 'BreakBrickBlock' ) {
      levelObjects.push( new GhostBreakBrickBlock( objDef.x, objDef.y ))
    }

  });

  return levelObjects;

}

module.exports = LevelGenerator;
