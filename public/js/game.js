let socket = io();
let otherPlayers = {};
let chatInput = document.getElementById('chatInput'); // Chat input element
let chatForm = document.getElementById('chatForm'); // Chat form element

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    player.chatMessage = chatInput.value;
    socket.emit('playerChat', chatInput.value);
    chatInput.value = '';
    
    // Start a timer to clear the player's chat message after 30 seconds
    setTimeout(() => {
        player.chatMessage = '';
    }, 30000);
});

socket.on('chatUpdate', (data) => {
    if (player.playerId === data.playerId) {
        player.chatMessage = data.chatMessage;
    } else if (otherPlayers[data.playerId]) {
        otherPlayers[data.playerId].chatMessage = data.chatMessage;
    }
});

socket.on('connect', () => {
    socket.emit('newPlayer', { pos: player.pos });
});

socket.on('currentPlayer', (data) => {
    player.playerId = data.playerId;
    player.title = "Player " + data.connectionNum;
});

socket.on('newPlayer', (data) => {
    otherPlayers[data.playerId] = new Mario.Player(data.gameData.pos);
    otherPlayers[data.playerId].title = "Player " + data.connectionNum;
});

socket.on('existingPlayers', (data) => {
    data.existingPlayers.forEach((playerData) => {
        otherPlayers[playerData.playerId] = new Mario.Player(playerData.gameData.pos);
        otherPlayers[playerData.playerId].title = "Player " + playerData.connectionNum;
    });
});

socket.on('playerDisconnected', (playerId) => {
    delete otherPlayers[playerId];
});

socket.on('playerMoved', (data) => {
    if (otherPlayers[data.player.playerId]) {
        otherPlayers[data.player.playerId].pos = data.player.gameData.pos;
    }
});



// Add this to your render function
for (var playerId in otherPlayers) {
    if (otherPlayers.hasOwnProperty(playerId)) {
        renderEntity(otherPlayers[playerId]);
    }
}

var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

//create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext('2d');
var updateables = [];
var fireballs = [];
var player = new Mario.Player([0,0]);

//we might have to get the size and calculate the scaling
//but this method should let us make it however big.
//Cool!
//TODO: Automatically scale the game to work and look good on widescreen.
//TODO: fiddling with scaled sprites looks BETTER, but not perfect. Hmm.
canvas.width = 762;
canvas.height = 720;
ctx.scale(3,3);
document.body.appendChild(canvas);

//viewport
var vX = 0,
    vY = 0,
    vWidth = 256,
    vHeight = 240;

//load our images
resources.load([
  'sprites/player.png',
  'sprites/enemy.png',
  'sprites/tiles.png',
  'sprites/playerl.png',
  'sprites/items.png',
  'sprites/enemyr.png',
]);

resources.onReady(init);
var level;
var sounds;
var music;

//initialize
var lastTime;
function init() {
  music = {
    overworld: new Audio('sounds/aboveground_bgm.ogg'),
    underground: new Audio('sounds/underground_bgm.ogg'),
    clear: new Audio('sounds/stage_clear.wav'),
    death: new Audio('sounds/mariodie.wav')
  };
  sounds = {
    smallJump: new Audio('sounds/jump-small.wav'),
    bigJump: new Audio('sounds/jump-super.wav'),
    breakBlock: new Audio('sounds/breakblock.wav'),
    bump: new Audio('sounds/bump.wav'),
    coin: new Audio('sounds/coin.wav'),
    fireball: new Audio('sounds/fireball.wav'),
    flagpole: new Audio('sounds/flagpole.wav'),
    kick: new Audio('sounds/kick.wav'),
    pipe: new Audio('sounds/pipe.wav'),
    itemAppear: new Audio('sounds/itemAppear.wav'),
    powerup: new Audio('sounds/powerup.wav'),
    stomp: new Audio('sounds/stomp.wav')
  };
  Mario.oneone();
  lastTime = Date.now();
  main();
}

var gameTime = 0;

//set up the game loop
function main() {
  var now = Date.now();
  var dt = (now - lastTime) / 1000.0;

  update(dt);
  render();

  lastTime = now;
  requestAnimFrame(main);
}

function update(dt) {
    gameTime += dt;

    handleInput(dt);
    updateEntities(dt, gameTime);

    checkCollisions();
    socket.emit('playerMovement', { pos: player.pos });
}

function handleInput(dt) {
  if (player.piping || player.dying || player.noInput) return; //don't accept input

  if (input.isDown('RUN')){
    player.run();
  } else {
    player.noRun();
  }
  if (input.isDown('JUMP')) {
    player.jump();
  } else {
    //we need this to handle the timing for how long you hold it
    player.noJump();
  }

  if (input.isDown('DOWN')) {
    player.crouch();
  } else {
    player.noCrouch();
  }

  if (input.isDown('LEFT')) { // 'd' or left arrow
    player.moveLeft();
  }
  else if (input.isDown('RIGHT')) { // 'k' or right arrow
    player.moveRight();
  } else {
    player.noWalk();
  }
}

//update all the moving stuff
function updateEntities(dt, gameTime) {
  player.update(dt, vX);
  updateables.forEach (function(ent) {
    ent.update(dt, gameTime);
  });

  //This should stop the jump when he switches sides on the flag.
  if (player.exiting) {
    if (player.pos[0] > vX + 96)
      vX = player.pos[0] - 96
  }else if (level.scrolling && player.pos[0] > vX + 80) {
    vX = player.pos[0] - 80;
  }

  if (player.powering.length !== 0 || player.dying) { return; }
  level.items.forEach (function(ent) {
    ent.update(dt);
  });

  level.enemies.forEach (function(ent) {
    ent.update(dt, vX);
  });

  fireballs.forEach(function(fireball) {
    fireball.update(dt);
  });
  level.pipes.forEach (function(pipe) {
    pipe.update(dt);
  });
}

//scan for collisions
function checkCollisions() {
  if (player.powering.length !== 0 || player.dying) { return; }
  player.checkCollisions();

  //Apparently for each will just skip indices where things were deleted.
  level.items.forEach(function(item) {
    item.checkCollisions();
  });
  level.enemies.forEach (function(ent) {
    ent.checkCollisions();
  });
  fireballs.forEach(function(fireball){
    fireball.checkCollisions();
  });
  level.pipes.forEach (function(pipe) {
    pipe.checkCollisions();
  });
}

//draw the game!
function render() {
    updateables = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = level.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  //scenery gets drawn first to get layering right.
  for(var i = 0; i < 15; i++) {
    for (var j = Math.floor(vX / 16) - 1; j < Math.floor(vX / 16) + 20; j++){
      if (level.scenery[i][j]) {
        renderEntity(level.scenery[i][j]);
      }
    }
  }

  //then items
  level.items.forEach (function (item) {
    renderEntity(item);
  });

  level.enemies.forEach (function(enemy) {
    renderEntity(enemy);
  });



  fireballs.forEach(function(fireball) {
    renderEntity(fireball);
  })

  //then we draw every static object.
  for(var i = 0; i < 15; i++) {
    for (var j = Math.floor(vX / 16) - 1; j < Math.floor(vX / 16) + 20; j++){
      if (level.statics[i][j]) {
        renderEntity(level.statics[i][j]);
      }
      if (level.blocks[i][j]) {
        renderEntity(level.blocks[i][j]);
        updateables.push(level.blocks[i][j]);
      }
    }
  }

  //then the player
  // Then the player
  // Render the player
if (player.invincibility % 2 === 0) {
    player.title = "Player 1"; // Set the title for the player
    renderEntity(player);
}

// Render other players
for (var playerId in otherPlayers) {
    if (otherPlayers.hasOwnProperty(playerId) && otherPlayers[playerId].invincibility % 2 === 0) {
        renderEntity(otherPlayers[playerId]);
    }
}




	// Mario goes INTO pipes, so naturally they go after.
    level.pipes.forEach (function(pipe) {
        renderEntity(pipe);
    });
}

function renderEntity(entity) {
    // Render the player's chat message
    if (entity.chatMessage) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 10px Arial";
        ctx.fillText(entity.chatMessage, entity.pos[0] - vX, entity.pos[1] - vY - 5);
    }

    // Render the entity
    entity.render(ctx, vX, vY);
}