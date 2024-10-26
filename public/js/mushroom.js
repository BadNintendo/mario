(function() {
  // Ensure Mario namespace exists
  if (typeof Mario === 'undefined') {
    window.Mario = {};
  }

  /**
   * Represents a Mushroom entity in the game.
   * @param {Array<number>} pos - The initial position of the mushroom in [x, y] format.
   */
  var Mushroom = Mario.Mushroom = function(pos) {
    this.spawning = false; // Indicates if the mushroom is currently spawning
    this.waiting = 0; // Time to wait before updating

    // Call the parent Entity constructor
    Mario.Entity.call(this, {
      pos: pos,
      sprite: level.superShroomSprite, // The mushroom's sprite
      hitbox: [0, 0, 16, 16] // Hitbox dimensions [offsetX, offsetY, width, height]
    });
  };

  // Inherit from Mario.Entity
  Mario.Util.inherits(Mushroom, Mario.Entity);

  /**
   * Renders the mushroom on the given canvas context.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} vX - The horizontal velocity for rendering.
   * @param {number} vY - The vertical velocity for rendering.
   */
  Mushroom.prototype.render = function(ctx, vX, vY) {
    if (this.spawning > 1) return; // Don't render if it's still spawning
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  };

  /**
   * Spawns the mushroom, possibly transforming it into a Fireflower.
   */
  Mushroom.prototype.spawn = function() {
    if (player.power > 0) {
      // Replace the mushroom with a fire flower
      var ff = new Mario.Fireflower(this.pos);
      ff.spawn();
      return;
    }
    sounds.itemAppear.play(); // Play the item appearance sound
    this.idx = level.items.length;
    level.items.push(this); // Add mushroom to the level items
    this.spawning = 12; // Set spawning duration
    this.targetpos = [this.pos[0], this.pos[1] - 16]; // Target position for spawning
  };

  /**
   * Updates the mushroom's position and state based on the elapsed time.
   * @param {number} dt - The time delta since the last update.
   */
  Mushroom.prototype.update = function(dt) {
    if (this.spawning > 1) {
      this.spawning -= 1; // Countdown spawning timer
      if (this.spawning === 1) this.vel[1] = -0.5; // Adjust vertical velocity
      return;
    }

    if (this.spawning) {
      if (this.pos[1] <= this.targetpos[1]) {
        this.pos[1] = this.targetpos[1]; // Snap to target position
        this.vel[1] = 0;
        this.waiting = 5; // Set waiting time
        this.spawning = 0; // Reset spawning state
        this.vel[0] = 1; // Initialize horizontal velocity
      }
    } else {
      this.acc[1] = 0.2; // Apply gravity when not spawning
    }

    if (this.waiting) {
      this.waiting -= 1; // Countdown waiting timer
    } else {
      // Update position based on velocity and acceleration
      this.vel[1] += this.acc[1];
      this.pos[0] += this.vel[0];
      this.pos[1] += this.vel[1];
      this.sprite.update(dt); // Update sprite animation
    }
  };

  /**
   * Handles collision with walls, reversing horizontal velocity.
   */
  Mushroom.prototype.collideWall = function() {
    this.vel[0] = -this.vel[0]; // Reverse horizontal velocity
  };

  /**
   * Checks for collisions with static objects and the player.
   */
  Mushroom.prototype.checkCollisions = function() {
    if (this.spawning) return; // Skip collision check if spawning

    var h = this.pos[1] % 16 === 0 ? 1 : 2; // Height based on vertical position
    var w = this.pos[0] % 16 === 0 ? 1 : 2; // Width based on horizontal position

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    // Remove mushroom if out of bounds
    if (baseY + h > 15) {
      delete level.items[this.idx];
      return;
    }

    // Check collisions with static and block objects
    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        if (level.statics[baseY + i][baseX + j]) {
          level.statics[baseY + i][baseX + j].isCollideWith(this);
        }
        if (level.blocks[baseY + i][baseX + j]) {
          level.blocks[baseY + i][baseX + j].isCollideWith(this);
        }
      }
    }

    this.isPlayerCollided(); // Check for player collisions
  };

  /**
   * Checks for collision with the player.
   */
  Mushroom.prototype.isPlayerCollided = function() {
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [player.pos[0] + player.hitbox[0], player.pos[1] + player.hitbox[1]];

    // Check if hitboxes overlap
    if (!(hpos1[0] > hpos2[0] + player.hitbox[2] || (hpos1[0] + this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1] + player.hitbox[3] || (hpos1[1] + this.hitbox[3] < hpos2[1]))) {
        player.powerUp(this.idx);
      }
    }
  };

  
  Mushroom.prototype.bump = function() {
    this.vel[1] = -2;
  }

  // Example usage of the Mushroom module
  //const mushroom = new Mario.Mushroom([100, 150]); // Create a new mushroom at position (100, 150)
  //mushroom.spawn(); // Spawn the mushroom
  // In the game loop, update and render the mushroom:
  // mushroom.update(deltaTime);
  // mushroom.render(context, cameraX, cameraY);
})();
