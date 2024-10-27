(function() {
  // Namespace for Mario module
  if (typeof Mario === 'undefined') {
    window.Mario = {};
  }

  /**
   * Represents a Goomba enemy.
   * @constructor
   * @param {Array} pos - Initial position of the Goomba [x, y].
   * @param {Object} sprite - The sprite object used for rendering the Goomba.
   */
  var Goomba = Mario.Goomba = function(pos, sprite) {
    this.dying = false; // Indicates if the Goomba is in the dying state.
    Mario.Entity.call(this, {
      pos: pos,
      sprite: sprite,
      hitbox: [0, 0, 16, 16] // Hitbox dimensions [offsetX, offsetY, width, height].
    });
    this.vel = [-0.5, 0]; // Initial velocity [velocityX, velocityY].
    this.idx = level.enemies.length; // Index of the Goomba in the enemies array.
  };

  // Inherit from Mario.Entity
  Goomba.prototype = Object.create(Mario.Entity.prototype);
  Goomba.prototype.constructor = Goomba;

  /**
   * Renders the Goomba on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The rendering context of the canvas.
   * @param {number} vX - The horizontal viewport offset.
   * @param {number} vY - The vertical viewport offset (not used in current implementation).
   */
  Goomba.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  };

  /**
   * Updates the Goomba's position and state.
   * @param {number} dt - The delta time since the last update.
   * @param {number} vX - The horizontal viewport offset.
   */
  Goomba.prototype.update = function(dt, vX) {
    if (this.pos[0] - vX > 336) return; // Out of view
    if (this.pos[0] - vX < -32) {
      delete level.enemies[this.idx]; // Remove if too far left
      return;
    }

    if (this.dying) {
      this.dying -= 1;
      if (!this.dying) {
        delete level.enemies[this.idx]; // Remove when done dying
      }
      return;
    }

    this.acc[1] = 0.2; // Gravity effect
    this.vel[1] += this.acc[1];
    this.pos[0] += this.vel[0]; // Update position based on velocity
    this.pos[1] += this.vel[1];
    this.sprite.update(dt); // Update sprite state
  };

  /**
   * Handles collision with walls by reversing horizontal velocity.
   */
  Goomba.prototype.collideWall = function() {
    this.vel[0] = -this.vel[0];
  };

  /**
   * Checks for collisions with other entities and the environment.
   */
  Goomba.prototype.checkCollisions = function() {
    if (this.flipping) return; // Ignore if flipping

    const height = this.pos[1] % 16 === 0 ? 1 : 2; // Determine height for collision checking
    const width = this.pos[0] % 16 === 0 ? 1 : 2;

    const baseX = Math.floor(this.pos[0] / 16);
    const baseY = Math.floor(this.pos[1] / 16);

    // Remove if off the bottom of the screen
    if (baseY + height > 15) {
      delete level.enemies[this.idx];
      return;
    }

    // Check for collisions with static and block entities
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (level.statics[baseY + i][baseX + j]) {
          level.statics[baseY + i][baseX + j].isCollideWith(this);
        }
        if (level.blocks[baseY + i][baseX + j]) {
          level.blocks[baseY + i][baseX + j].isCollideWith(this);
        }
      }
    }

    // Check collisions with other enemies and the player
    const self = this;
    level.enemies.forEach(function(enemy) {
      if (enemy === self || enemy.pos[0] - vX > 336) return; // Skip self and out-of-view enemies
      self.isCollideWith(enemy);
    });
    this.isCollideWith(player);
  };

  /**
   * Checks for collision with another entity.
   * @param {Mario.Entity} ent - The entity to check collision against.
   */
  Goomba.prototype.isCollideWith = function(ent) {
    if (ent instanceof Mario.Player && (this.dying || ent.invincibility)) {
      return; // Ignore collisions if invincible
    }

    const hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]]; // Hitbox position of Goomba
    const hpos2 = [ent.pos[0] + ent.hitbox[0], ent.pos[1] + ent.hitbox[1]]; // Hitbox position of entity

    // Check for overlapping hitboxes
    if (!(hpos1[0] > hpos2[0] + ent.hitbox[2] || hpos1[0] + this.hitbox[2] < hpos2[0]) &&
        !(hpos1[1] > hpos2[1] + ent.hitbox[3] || hpos1[1] + this.hitbox[3] < hpos2[1])) {
      if (ent instanceof Mario.Player) {
        if (ent.vel[1] > 0) { //then the goomba dies
          this.stomp();
        } else if (ent.starTime) {
          this.bump();
        } else { //or the player gets hit
          ent.damage();
        }
      } else {
        this.collideWall();
      }
    }
  };

  Goomba.prototype.stomp = function() {
    sounds.stomp.play();
    player.bounce = true;
    this.sprite.pos[0] = 32;
    this.sprite.speed = 0;
    this.vel[0] = 0;
    this.dying = 10;
  };

  Goomba.prototype.bump = function() {
    sounds.kick.play();
    this.sprite.img = 'sprites/enemyr.png';
    this.flipping = true;
    this.pos[1] -= 1;
    this.vel[0] = 0;
    this.vel[1] = -2.5;
  };

  // Rendering and updating loop
  function gameLoop(dt, vX) {
    goomba.update(dt, vX);
    goomba.render(ctx, vX, 0); // Assuming ctx is your rendering context
  }

})();
