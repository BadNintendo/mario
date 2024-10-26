(function() {
  // Ensure Mario namespace exists
  if (typeof Mario === 'undefined') {
    window.Mario = {};
  }
  
  /**
   * Represents a Block entity in the game.
   * @param {Object} options - Configuration options for the block.
   * @param {Object} options.item - The item to spawn when the block is interacted with.
   * @param {Object} options.usedSprite - The sprite to display when the block has been used.
   * @param {Object} options.bounceSprite - The sprite to display when the block is bounced on.
   * @param {boolean} options.breakable - Indicates if the block can be broken.
   */
  var Block = Mario.Block = function(options) {
    this.item = options.item; // Item to spawn
    this.usedSprite = options.usedSprite; // Sprite after being used
    this.bounceSprite = options.bounceSprite; // Sprite for bouncing
    this.breakable = options.breakable; // Is the block breakable?

    // Initialize the entity properties
    Mario.Entity.call(this, {
      pos: options.pos, // Position of the block
      sprite: options.sprite, // Current sprite of the block
      hitbox: [0, 0, 16, 16] // Hitbox dimensions [offsetX, offsetY, width, height]
    });

    this.standing = true; // Indicates if the block is in a standing state
  };

  // Inherit from Mario.Floor
  Mario.Util.inherits(Block, Mario.Floor);

  /**
   * Breaks the block, playing sound and spawning rubble.
   */
  Block.prototype.break = function() {
    sounds.breakBlock.play(); // Play block breaking sound
    (new Mario.Rubble()).spawn(this.pos); // Spawn rubble at block's position
    var x = this.pos[0] / 16, y = this.pos[1] / 16;
    delete level.blocks[y][x]; // Remove block from level
  };

  /**
   * Handles the interaction when the block is bonked.
   * @param {number} power - The power level of the interaction.
   */
  Block.prototype.bonk = function(power) {
    sounds.bump.play(); // Play bump sound
    if (power > 0 && this.breakable) {
      this.break(); // Break the block if it is breakable
    } else if (this.standing) {
      this.standing = false; // Update standing state
      if (this.item) {
        this.item.spawn(); // Spawn the item if it exists
        this.item = null; // Clear item reference
      }
      this.opos = [this.pos[0], this.pos[1]]; // Store original position
      this.osprite = this.sprite; // Store original sprite

      // Switch to bounce or used sprite
      this.sprite = this.bounceSprite ? this.bounceSprite : this.usedSprite;

      this.vel[1] = -2; // Set vertical velocity for bounce
    }
  };

  /**
   * Updates the block's state and position based on the elapsed time.
   * @param {number} dt - The time delta since the last update.
   * @param {number} gameTime - The total game time.
   */
  Block.prototype.update = function(dt, gameTime) {
    if (!this.standing) {
      if (this.pos[1] < this.opos[1] - 8) {
        this.vel[1] = 2; // Adjust velocity to fall down
      }
      if (this.pos[1] > this.opos[1]) {
        this.vel[1] = 0; // Stop vertical movement
        this.pos = this.opos; // Reset position to original
        this.sprite = this.osprite || this.sprite; // Restore original sprite if it exists
        this.standing = true; // Set standing state back to true
      }
    } else {
      if (this.sprite === this.usedSprite) {
        var x = this.pos[0] / 16, y = this.pos[1] / 16;
        level.statics[y][x] = new Mario.Floor(this.pos, this.usedSprite); // Replace block with floor
        delete level.blocks[y][x]; // Remove block from level
      }
    }

    this.pos[1] += this.vel[1]; // Update vertical position
    this.sprite.update(dt, gameTime); // Update sprite animation
  };

})();