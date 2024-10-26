(function() {
	// Ensure the Mario namespace exists
	if (typeof Mario === 'undefined') {
	  window.Mario = {};
	}
  
	/**
	 * Represents a Floor entity in the game.
	 * @param {Array<number>} pos - The initial position of the Floor in [x, y] format.
	 * @param {Object} sprite - The sprite representation of the Floor.
	 */
	var Floor = Mario.Floor = function(pos, sprite) {
	  Mario.Entity.call(this, {
		pos: pos, // Position of the Floor
		sprite: sprite, // Sprite representation of the Floor
		hitbox: [0, 0, 16, 16] // Hitbox dimensions [offsetX, offsetY, width, height]
	  });
	};
  
	// Inherit from Mario.Entity
	Mario.Util.inherits(Floor, Mario.Entity);
  
	/**
	 * Checks for collision between this Floor and another entity.
	 * @param {Mario.Entity} ent - The entity to check for collision with.
	 */
	Floor.prototype.isCollideWith = function(ent) {
	  // Calculate hitbox positions for both entities
	  var hpos1 = [Math.floor(this.pos[0] + this.hitbox[0]), Math.floor(this.pos[1] + this.hitbox[1])];
	  var hpos2 = [Math.floor(ent.pos[0] + ent.hitbox[0]), Math.floor(ent.pos[1] + ent.hitbox[1])];
  
	  // Check if hitboxes overlap
	  if (!(hpos1[0] > hpos2[0] + ent.hitbox[2] || (hpos1[0] + this.hitbox[2] < hpos2[0])) &&
		  !(hpos1[1] > hpos2[1] + ent.hitbox[3] || (hpos1[1] + this.hitbox[3] < hpos2[1]))) {
		
		// Handle collisions based on relative position
		if (!this.standing) {
		  ent.bump(); // Entity bumps if the floor is not standing
		} else {
		  this.handleEntityCollision(ent, hpos1, hpos2);
		}
	  }
	};
  
	/**
	 * Handles collision response when an entity collides with the Floor.
	 * @param {Mario.Entity} ent - The entity that is colliding with the Floor.
	 * @param {Array<number>} hpos1 - The hitbox position of the Floor.
	 * @param {Array<number>} hpos2 - The hitbox position of the colliding entity.
	 */
	Floor.prototype.handleEntityCollision = function(ent, hpos1, hpos2) {
	  var center = hpos2[0] + ent.hitbox[2] / 2;
  
	  // Check if the entity is landing on the floor
	  if (Math.abs(hpos2[1] + ent.hitbox[3] - hpos1[1]) <= ent.vel[1]) {
		// Prevent standing on top of a solid static block
		if (level.statics[(this.pos[1] / 16) - 1][this.pos[0] / 16]) return;
		ent.vel[1] = 0; // Reset vertical velocity
		ent.pos[1] = hpos1[1] - ent.hitbox[3] - ent.hitbox[1]; // Position entity on top of the floor
		ent.standing = true; // Set entity as standing
		if (ent instanceof Mario.Player) {
		  ent.jumping = 0; // Reset jump status for player
		}
	  } 
	  // Check if the entity is below the floor
	  else if (Math.abs(hpos2[1] - hpos1[1] - this.hitbox[3]) > ent.vel[1] &&
			   center + 2 >= hpos1[0] && center - 2 <= hpos1[0] + this.hitbox[2]) {
		ent.vel[1] = 0; // Reset vertical velocity
		ent.pos[1] = hpos1[1] + this.hitbox[3]; // Position entity above the floor
		if (ent instanceof Mario.Player) {
		  this.bonk(ent.power); // Handle player bonking the floor
		  ent.jumping = 0; // Reset jump status for player
		}
	  } 
	  // Handle side collision
	  else {
		ent.collideWall(this); // Treat floor as a wall
	  }
	};
  
	/**
	 * Placeholder for additional bonking logic.
	 */
	Floor.prototype.bonk = function() {
	  // Implementation can be added later
	};
  })();
  