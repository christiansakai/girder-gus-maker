function initLoadState() {

  var state = {};
  var game = window.game;

  state.preload = function () {

    console.log( "Loading assets..." );

    game.load.image('BlackBrickBlock', '/assets/images/brick_black.png');
    game.load.image('BreakBrickBlock', '/assets/images/brick_break.png');
    game.load.image('RedBrickBlock', '/assets/images/brick_red.png');
    game.load.image('Girder', '/assets/images/girder.png');
    game.load.image('Spike', '/assets/images/spike.png');
    game.load.image('Tool', '/assets/images/tool.png');
    game.load.image('Gus', '/assets/images/gus-static.png');

    console.log( "Done loading" );

  }

  state.create = function () {

      console.log( "Starting world..." );
      game.world.setBounds( -400, -300, 800, 600 ); // fullscreen???

      console.log( "Going to create state..." );
      // start game state
      game.state.start( "create" );

  }

  return state;

}

module.exports = initLoadState;
