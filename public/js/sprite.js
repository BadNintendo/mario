(function() {
  // Ensure the Mario namespace exists
  if (typeof Mario === 'undefined') {
    window.Mario = {};
  }

  /**
   * Represents a Sprite in the game.
   * @param {string} img - The image source for the sprite.
   * @param {Array<number>} pos - The position of the sprite in [x, y] format.
   * @param {Array<number>} size - The size of the sprite in [width, height] format.
   * @param {number} speed - The speed at which the sprite frames should change.
   * @param {Array<number>} frames - An array of frame indices for the sprite animation.
   * @param {boolean} once - Indicates if the animation should only play once.
   */
  var Sprite = Mario.Sprite = function(img, pos, size, speed, frames, once) {
    this.pos = pos;          // Position of the sprite
    this.size = size;        // Size of the sprite
    this.speed = speed;      // Frame change speed
    this._index = 0;        // Current frame index
    this.img = img;          // Image source
    this.once = once;        // Play once flag
    this.frames = frames;    // Animation frames
    this.lastUpdated = null; // Last update timestamp
    this.done = false;       // Indicates if animation is finished
  };

  /**
   * Updates the current frame index based on the elapsed time.
   * @param {number} dt - Delta time since the last update.
   * @param {number} gameTime - Current game time for synchronization.
   */
  Sprite.prototype.update = function(dt, gameTime) {
    if (gameTime && gameTime === this.lastUpdated) return; // Skip if already updated

    this._index += this.speed * dt; // Increment frame index by speed
    if (gameTime) this.lastUpdated = gameTime; // Store last updated time
  };

  /**
   * Sets the current frame index manually.
   * @param {number} frame - The frame index to set.
   */
  Sprite.prototype.setFrame = function(frame) {
    this._index = frame; // Set the specified frame index
  };

  /**
   * Renders the current sprite frame on the provided canvas context.
   * @param {CanvasRenderingContext2D} ctx - The canvas context to render to.
   * @param {number} posx - The x position to render the sprite.
   * @param {number} posy - The y position to render the sprite.
   * @param {number} vX - The horizontal velocity (for camera movement).
   * @param {number} vY - The vertical velocity (for camera movement).
   */
  Sprite.prototype.render = function(ctx, posx, posy, vX, vY) {
    var frame;

    // Determine the current frame based on speed and index
    if (this.speed > 0) {
      var max = this.frames.length;
      var idx = Math.floor(this._index);
      frame = this.frames[idx % max]; // Cycle through frames

      if (this.once && idx >= max) {
        this.done = true; // Mark animation as finished if playing once
        return;
      }
    } else {
      frame = 0; // Default frame if speed is zero
    }

    // Calculate the rendering position
    var x = this.pos[0] + frame * this.size[0] + (1 / 3);
    var y = this.pos[1] + (1 / 3);

    // Render the sprite on the canvas
    ctx.drawImage(
      resources.get(this.img),
      x, y, 
      this.size[0] - (2 / 3), this.size[1] - (2 / 3),
      Math.round(posx - vX), Math.round(posy - vY),
      this.size[0], this.size[1]
    );
  };
})();