// input.js - Client-side module for handling keyboard input
(function () {
  // Object to keep track of pressed keys
  const pressedKeys = {};

  // Key mappings for easy reference
  const keyMappings = {
      32: { name: 'RUN', elementId: 'key-space' }, // Space for Run
      37: { name: 'LEFT', elementId: 'key-left' },
      38: { name: 'JUMP', elementId: 'key-up' }, // Up for Jump
      39: { name: 'RIGHT', elementId: 'key-right' },
      40: { name: 'DOWN', elementId: 'key-down' },
      88: { name: 'JUMP', elementId: 'key-x' }, // X for Jump
      90: { name: 'RUN', elementId: 'key-z' } // Z for Run
  };

  /**
   * Sets the status of a key (pressed or released)
   * @param {KeyboardEvent} event - The keyboard event object
   * @param {boolean} status - The status of the key (true for pressed, false for released)
   */
  function setKey(event, status) {
      const { keyCode } = event; // Destructure keyCode from event
      const keyData = keyMappings[keyCode]; // Get key data from mappings
      const key = keyData ? keyData.name : String.fromCharCode(keyCode); // Get key name or use char code

      // Update pressed keys status
      pressedKeys[key] = status;

      // Update the visual representation of the key
      updateKeyVisual(keyData?.elementId, status);
      if (status) movePlayer(key);
  }

  /**
   * Updates the visual representation of the key pressed
   * @param {string} elementId - The DOM element ID for the key
   * @param {boolean} status - The status of the key (pressed or released)
   */
  function updateKeyVisual(elementId, status) {
      if (!elementId) return; // Exit if no elementId provided

      const keyElement = document.getElementById(elementId);
      if (keyElement) {
          keyElement.classList.toggle('pressed', status); // Add/remove pressed class based on status
      }
  }

  /**
   * Moves the player based on the pressed key
   * @param {string} key - The key that was pressed
   */
  function movePlayer(key) {
      const player = window.player; // Access the player object from the global scope

      // Map keys to player actions
      const actions = {
          'LEFT': player.moveLeft,
          'RIGHT': player.moveRight,
          'JUMP': player.jump,
          'RUN': player.run,
          'DOWN': player.crouch,
          'UP': player.climb // Optional: Make player climb
      };

      const action = actions[key];
      if (action) action.call(player); // Execute the action if it exists
  }

  // Event listener for keydown events
  document.addEventListener('keydown', (e) => setKey(e, true));

  // Event listener for keyup events
  document.addEventListener('keyup', (e) => setKey(e, false));

  // Event listener for when the window loses focus
  window.addEventListener('blur', () => {
      resetKeys(); // Reset pressed keys
  });

  /**
   * Resets all pressed keys and visual representations
   */
  function resetKeys() {
      Object.keys(pressedKeys).forEach(key => {
          pressedKeys[key] = false; // Set all keys as released
      });

      // Reset all key visuals
      const keys = document.getElementsByClassName('key');
      Array.from(keys).forEach(key => key.classList.remove('pressed'));
  }

  // Expose input functions to the global scope
  window.input = {
      /**
       * Checks if a specific key is currently pressed
       * @param {string} key - The key to check
       * @returns {boolean} - True if the key is pressed, false otherwise
       */
      isDown(key) {
          return pressedKeys[key.toUpperCase()] || false; // Return pressed status or false
      },

      /**
       * Resets all key states and visuals
       */
      reset() {
          resetKeys(); // Call reset function
      }
  };
})();