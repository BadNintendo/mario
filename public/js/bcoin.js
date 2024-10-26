(function() {
  // Ensure the Mario namespace exists
  if (typeof Mario === 'undefined') {
    window.Mario = {};
  }

  /**
   * Represents a Bcoin entity in the game, a collectible coin that bounces.
   * @param {Array<number>} pos - The initial position of the Bcoin in [x, y] format.
   */
  var Bcoin = Mario.Bcoin = function(pos) {
    Mario.Entity.call(this, {
      pos: pos, // Position of the Bcoin
      sprite: level.bcoinSprite(), // Sprite representation of the Bcoin
      hitbox: [0, 0, 16, 16] // Hitbox dimensions [offsetX, offsetY, width, height]
    });
    this.active = false; // Indicates if the Bcoin is currently active
    this.vel = 0; // Vertical velocity for the Bcoin
    this.acc = 0; // Vertical acceleration for the Bcoin
  };

  // Inherit from Mario.Entity
  Mario.Util.inherits(Bcoin, Mario.Entity);

  /**
   * Spawns the Bcoin, making it active and playing the collection sound.
   */
  Bcoin.prototype.spawn = function() {
    sounds.coin.currentTime = 0.05; // Reset coin sound playback
    sounds.coin.play(); // Play coin collection sound
    this.idx = level.items.length; // Index of the Bcoin in level items
    level.items.push(this); // Add Bcoin to the level items
    this.active = true; // Mark the Bcoin as active
    this.vel = -12; // Initial upward velocity
    this.targetpos = this.pos[1] - 32; // Target position for bouncing
  };

  /**
   * Updates the Bcoin's position based on its velocity and acceleration.
   * @param {number} dt - The time delta since the last update.
   */
  Bcoin.prototype.update = function(dt) {
    if (!this.active) return; // Exit if the Bcoin is not active

    // Check if Bcoin has reached its target position
    if (this.vel > 0 && this.pos[1] >= this.targetpos) {
      player.coins += 1; // Increment player's coin count
      delete level.items[this.idx]; // Remove Bcoin from level items
      return; // Exit after collecting the coin
    }

    this.acc = 0.75; // Define constant vertical acceleration
    this.vel += this.acc; // Update velocity with acceleration
    this.pos[1] += this.vel; // Update the position based on velocity
    this.sprite.update(dt); // Update sprite animation
  };

  /**
   * Checks for collisions with other entities (not implemented).
   */
  Bcoin.prototype.checkCollisions = function() {
    // Collision logic can be implemented here if needed
  };

})();