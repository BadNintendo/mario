(function() {
  var pressedKeys = {};

  function setKey(event, status) {
    var code = event.keyCode;
    var key;
    var keyElementId;

    switch (code) {
      case 32:
        key = 'SPACE';
        keyElementId = 'key-space';
        break;
      case 37:
        key = 'LEFT';
        keyElementId = 'key-left';
        break;
      case 38:
        key = 'UP';
        keyElementId = 'key-up';
        break;
      case 39:
        key = 'RIGHT';
        keyElementId = 'key-right';
        break;
      case 40:
        key = 'DOWN';
        keyElementId = 'key-down';
        break;
      case 88:
        key = 'JUMP';
        keyElementId = 'key-x';
        break;
      case 90:
        key = 'RUN';
        keyElementId = 'key-z';
        break;
      default:
        key = String.fromCharCode(code);
    }

    pressedKeys[key] = status;

    var keyElement = document.getElementById(keyElementId);
    if (keyElement) {
      if (status) {
        keyElement.classList.add('pressed');
        // Move the player based on the button pressed
        movePlayer(key);
      } else {
        keyElement.classList.remove('pressed');
      }
    }
  }

  function movePlayer(key) {
    // Get the player object from the game.js file
    var player = window.player;

    // Perform player movements based on the button pressed
    switch (key) {
      case 'LEFT':
        player.moveLeft();
        break;
      case 'RIGHT':
        player.moveRight();
        break;
      case 'JUMP':
        player.jump();
        break;
      case 'RUN':
        player.run();
        break;
      case 'DOWN':
        player.crouch();
        break;
      default:
        break;
    }
  }

  document.addEventListener('keydown', function(e) {
    setKey(e, true);
  });

  document.addEventListener('keyup', function(e) {
    setKey(e, false);
  });

  window.addEventListener('blur', function() {
    pressedKeys = {};
    // Reset all key visuals when window loses focus
    var keys = document.getElementsByClassName('key');
    for (var i = 0; i < keys.length; i++) {
      keys[i].classList.remove('pressed');
    }
  });

  window.input = {
    isDown: function(key) {
      return pressedKeys[key.toUpperCase()];
    },
    reset: function() {
      pressedKeys['RUN'] = false;
      pressedKeys['LEFT'] = false;
      pressedKeys['RIGHT'] = false;
      pressedKeys['DOWN'] = false;
      pressedKeys['JUMP'] = false;
      // Reset all key visuals when controls are reset
      var keys = document.getElementsByClassName('key');
      for (var i = 0; i < keys.length; i++) {
        keys[i].classList.remove('pressed');
      }
    }
  };
})();
