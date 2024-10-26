const socket = io({
  path: '/socket.io',
  reconnectionAttempts: 3,
  reconnectionDelay: 5000,
  transports: ['websocket']
});

let otherPlayers = {};
let updateables = [];
let fireballs = [];
let playerInitialized = false;

/* Player instance created at initial position [0, 0] */
player = new Mario.Player([0, 0]);

/* References to chat input field and form elements */
const chatInput = document.getElementById('chatInput');
const chatForm = document.getElementById('chatForm');

/**
 * Chat form submission handler
 * Emits player’s chat message and clears the input
 * @param {Event} e - Submit event object for form submission
 */
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (player) {
        player.chatMessage = chatInput.value;
        socket.emit('playerChat', chatInput.value);
        chatInput.value = '';

        /* Clears player's chat message after 30 seconds */
        setTimeout(() => {
            if (player) player.chatMessage = '';
        }, 30000);
    }
});

/**
 * Updates chat messages from other players
 * @param {Object} data - Contains playerId and chatMessage
 */
socket.on('chatUpdate', (data) => {
    if (player?.playerId === data.playerId) {
        player.chatMessage = data.chatMessage;
    } else if (otherPlayers[data.playerId]) {
        otherPlayers[data.playerId].chatMessage = data.chatMessage;
    }
});

/* Emitted when the client connects to the server, sends player's initial position */
socket.on('connect', () => {
  if (!playerInitialized) {
      socket.emit('newPlayer', { pos: player?.pos });
      playerInitialized = true;
  }
});

/**
 * Receives data for the current player upon connection
 * @param {Object} data - Contains playerId and connectionNum
 */
socket.on('currentPlayer', (data) => {
  if (player) {
      player.playerId = data.playerId;
      player.title = "Player " + data.connectionNum;
      if (!playerInitialized) {
          player.pos = [0, 0]; // Or another starting position
          playerInitialized = true; // Set to true to avoid re-initialization
      }
  }
});

/**
 * Adds a new player to otherPlayers when notified by the server
 * @param {Object} data - Contains playerId, connectionNum, and gameData
 */
socket.on('newPlayer', (data) => {
  if (data.gameData.pos[0] !== 0 || data.gameData.pos[1] !== 0) {
      otherPlayers[data.playerId] = new Mario.Player(data.gameData.pos);
      otherPlayers[data.playerId].title = "Player " + data.connectionNum;
  }
});

/**
 * Populates existing players in the game when joining
 * @param {Object} data - Contains an array of existingPlayers
 */
socket.on('existingPlayers', (data) => {
  data.existingPlayers.forEach((playerData) => {
      if (playerData.gameData.pos[0] !== 0 || playerData.gameData.pos[1] !== 0) {
          otherPlayers[playerData.playerId] = new Mario.Player(playerData.gameData.pos);
          otherPlayers[playerData.playerId].title = "Player " + playerData.connectionNum;
      }
  });
});

/**
 * Removes a player from the game upon disconnection
 * @param {String} playerId - Unique identifier of the disconnected player
 */
socket.on('playerDisconnected', (playerId) => {
    delete otherPlayers[playerId];
});

/**
 * Updates positions of players when they move
 * @param {Object} data - Contains player's playerId and gameData position
 */
socket.on('playerMoved', (data) => {
    if (otherPlayers[data.player.playerId]) {
        otherPlayers[data.player.playerId].pos = data.player.gameData.pos;
    }
});

/* Renders all other players in the game */
Object.keys(otherPlayers).forEach(playerId => renderEntity(otherPlayers[playerId]));

/** 
 * Creates a cross-browser compatible request animation frame 
 * Ensures 60 FPS for smooth transitions in animations
 */
const requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        (callback => window.setTimeout(callback, 1000 / 60));
})();

/* Canvas setup for rendering game graphics */
const canvas = document.createElement("canvas"),
      ctx = canvas.getContext('2d');
canvas.width = 762;
canvas.height = 720;
ctx.scale(3, 3);
document.body.appendChild(canvas);

/** 
 * Viewport dimensions defining visible game area 
 * @vX, @vY - viewport origin coordinates 
 * @vWidth, @vHeight - viewport width and height
 */
let vX = 0, vY = 0, vWidth = 256, vHeight = 240;

/* Load essential game resources: sprites, images, sounds */
resources.load([
    'sprites/player.png',
    'sprites/enemy.png',
    'sprites/tiles.png',
    'sprites/playerl.png',
    'sprites/items.png',
    'sprites/enemyr.png'
]);
resources.onReady(init); 

/**
 * Initializes the game elements, music, and sound effects
 * Sets up game background music and sound effects for various actions
 */
let level, sounds, music, lastTime, gameTime = 0;
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
    itemAppear: new Audio('sounds/itemappear.wav'),
    powerup: new Audio('sounds/powerup.wav'),
    stomp: new Audio('sounds/stomp.wav')
  };
  Mario.oneone(); // Start level setup
  lastTime = Date.now();
  main(); // Begin main loop
}

/** 
 * Main game loop; continuously updates game state and re-renders the game 
 * Calls itself recursively using requestAnimFrame to ensure smooth animation
 */
function main() {
  const now = Date.now(),
        dt = (now - lastTime) / 1000.0;
  update(dt);
  render();
  lastTime = now;
  requestAnimFrame(main);
}

/**
 * Updates game state based on time delta (dt)
 * @param {Number} dt - Time delta in seconds since last update
 */
function update(dt) {
  gameTime += dt;
  handleInput(dt);           // Process user input for player actions
  updateEntities(dt, gameTime); // Refresh all game entities based on dt
  checkCollisions();         // Detect and respond to collisions
  socket.emit('playerMovement', { pos: player?.pos }); // Send player position to server
}

/**
 * Handles player input for movement and actions
 * @param {Number} dt - Time delta for handling input at a consistent speed
 */
function handleInput(dt) {
  if (player && !player.piping && !player.dying && !player.noInput) {
      if (input.isDown('RUN')) player.run();
      else player.noRun();
      if (input.isDown('JUMP')) player.jump();
      else player.noJump();
      if (input.isDown('DOWN')) player.crouch();
      else player.noCrouch();
      if (input.isDown('LEFT')) player.moveLeft();
      else if (input.isDown('RIGHT')) player.moveRight();
      else player.noWalk();
  }
}

/**
 * Updates all active game entities, including player, items, enemies, and fireballs
 * @param {Number} dt - Time delta for updating entity states
 * @param {Number} gameTime - Total elapsed game time, used for timed events
 */
function updateEntities(dt, gameTime) {
  player?.update(dt, vX);    // Update player with dt and viewport x-axis position
  updateables.forEach(ent => ent.update(dt, gameTime)); // Refresh updateable entities

  /* Handles viewport shifting as player moves */
  if (player.exiting) {
      if (player.pos[0] > vX + 96)
          vX = player.pos[0] - 96;
  } else if (level.scrolling && player.pos[0] > vX + 80) {
      vX = player.pos[0] - 80;
  }

  /* Return early if player is powering up or dying */
  if (player.powering.length !== 0 || player.dying) return;

  /* Update each item, enemy, fireball, and pipe in the game */
  level.items.forEach(ent => ent.update(dt));
  level.enemies.forEach(ent => ent.update(dt, vX));
  fireballs.forEach(fireball => fireball.update(dt));
  level.pipes.forEach(pipe => pipe.update(dt));
}

/**
 * Scans for and manages collisions between player, items, enemies, fireballs, and pipes
 */
function checkCollisions() {
  if (player.powering.length !== 0 || player.dying) return; // Skip if player is powering up or dying
  player.checkCollisions(); // Check collisions for the player

  /* Check collisions for each game entity type */
  level.items.forEach(item => item.checkCollisions());
  level.enemies.forEach(ent => ent.checkCollisions());
  fireballs.forEach(fireball => fireball.checkCollisions());
  level.pipes.forEach(pipe => pipe.checkCollisions());
}

/**
 * Renders the entire game scene, clearing the previous frame and layering elements
 */
function render() {
  updateables = []; // Reset updateable entities for the frame
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas for next render
  ctx.fillStyle = level.background; // Fill canvas background with level color
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw filled rectangle covering the entire canvas

  /** 
   * Render scenery for layering; first draw static items in viewable range 
   * Loops through the scenery array to render each entity
   */
  for (let i = 0; i < 15; i++) {
      for (let j = Math.floor(vX / 16) - 1; j < Math.floor(vX / 16) + 20; j++) {
          if (level.scenery[i][j]) { // Check if scenery exists at current indices
              renderEntity(level.scenery[i][j]); // Render scenery entity
          }
      }
  }

  /** 
   * Render dynamic items in the scene, such as collectibles and enemies 
   * Uses forEach to iterate over items and enemies to render each entity
   */
  level.items.forEach(item => renderEntity(item)); // Render each item in the level
  level.enemies.forEach(enemy => renderEntity(enemy)); // Render each enemy in the level
  fireballs.forEach(fireball => renderEntity(fireball)); // Render each fireball in the level

  /** 
   * Render static objects like blocks and other level details 
   * Loops through statics and blocks arrays for rendering
   */
  for (let i = 0; i < 15; i++) {
      for (let j = Math.floor(vX / 16) - 1; j < Math.floor(vX / 16) + 20; j++) {
          if (level.statics[i][j]) { // Check if static object exists at current indices
              renderEntity(level.statics[i][j]); // Render static entity
          }
          if (level.blocks[i][j]) { // Check if block exists at current indices
              renderEntity(level.blocks[i][j]); // Render block entity
              updateables.push(level.blocks[i][j]); // Add block to updateables for next frame
          }
      }
  }

  /** 
   * Render the player character 
   * Conditional check for player's invincibility state
   */
  if (player.invincibility % 2 === 0) {
      player.title = "Player 1"; // Set the title for the player
      renderEntity(player); // Render the player entity
  }

  /** 
   * Render other players in the game 
   * Iterates through other players and checks their invincibility state
   */
  for (var playerId in otherPlayers) {
      if (otherPlayers.hasOwnProperty(playerId) && otherPlayers[playerId].invincibility % 2 === 0) {
          renderEntity(otherPlayers[playerId]); // Render other player entity
      }
  }

  /** 
   * Render pipes; pipes are rendered last as Mario interacts with them 
   * Loops through pipes in the level and renders each
   */
  level.pipes.forEach(function (pipe) {
      renderEntity(pipe); // Render pipe entity
  });
}

/**
* Renders a given game entity on the canvas
* @param {Object} entity - The entity to render, which can be a player, enemy, item, etc.
*/
function renderEntity(entity) {
  // Render the player's chat message above the entity if it exists
  if (entity.chatMessage) {
      ctx.fillStyle = "#FFFFFF"; // Set color for chat message text
      ctx.font = "bold 10px Arial"; // Set font style and size
      ctx.fillText(entity.chatMessage, entity.pos[0] - vX, entity.pos[1] - vY - 5); // Render chat message text
  }

  // Render the entity itself using its own render method
  entity.render(ctx, vX, vY); // Calls the render method on the entity, passing in the context and viewport offsets
}