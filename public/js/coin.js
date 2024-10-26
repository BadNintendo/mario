(function() {
  // Ensure the Mario namespace exists
  if (typeof Mario === 'undefined') {
    window.Mario = {};
  }

  /**
   * Represents a Coin entity in the game.
   * @param {Array<number>} pos - The initial position of the coin in [x, y] format.
   * @param {Object} sprite - The sprite representation of the coin.
   */
  var Coin = Mario.Coin = function(pos, sprite) {
    Mario.Entity.call(this, {
      pos: pos, // Position of the coin
      sprite: sprite, // Coin's sprite
      hitbox: [0, 0, 16, 16] // Hitbox dimensions [offsetX, offsetY, width, height]
    });
    this.idx = level.items.length; // Index of the coin in level items
  };

  // Inherit from Mario.Entity
  Mario.Util.inherits(Coin, Mario.Entity);

  /**
   * Checks for collision with the player.
   * If a collision is detected, the coin is collected.
   */
  Coin.prototype.isPlayerCollided = function() {
    // Calculate hitbox positions for the coin and player
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [player.pos[0] + player.hitbox[0], player.pos[1] + player.hitbox[1]];

    // Check for overlap between the coin's and player's hitboxes
    if (!(hpos1[0] > hpos2[0] + player.hitbox[2] || (hpos1[0] + this.hitbox[2] < hpos2[0])) &&
        !(hpos1[1] > hpos2[1] + player.hitbox[3] || (hpos1[1] + this.hitbox[3] < hpos2[1]))) {
      this.collect(); // Collect the coin if there's a collision
    }
  };

  /**
   * Renders the coin on the given canvas context.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} vX - The horizontal velocity for rendering.
   * @param {number} vY - The vertical velocity for rendering.
   */
  Coin.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY); // Render the coin sprite
  };

  /**
   * Updates the coin's state. Coins are not affected by gravity.
   * @param {number} dt - The time delta since the last update.
   */
  Coin.prototype.update = function(dt) {
    this.sprite.update(dt); // Update the sprite animation
  };

  /**
   * Checks for collisions with the player.
   */
  Coin.prototype.checkCollisions = function() {
    this.isPlayerCollided(); // Check for player collision
  };

  /**
   * Collects the coin, updating the player's score and playing a sound.
   */
  Coin.prototype.collect = function() {
    sounds.coin.currentTime = 0.05; // Reset coin sound playback
    sounds.coin.play(); // Play coin collection sound
    player.coins += 1; // Increment player's coin count
    delete level.items[this.idx]; // Remove coin from level items
  };
})();