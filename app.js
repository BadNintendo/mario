const express = require('express'); // Import Express framework
const http = require('http'); // Import HTTP module
const socketIo = require('socket.io'); // Import Socket.IO for WebSocket functionality
const fs = require('fs'); // Import file system module
const path = require('path'); // Import path module for file path handling

// Initialize the Express application
const app = express();

// Set the view engine to EJS for rendering dynamic content
app.set('view engine', 'ejs');


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server
const httpServer = http.createServer(app);

// Set keep-alive timeout for HTTP server
httpServer.keepAliveTimeout = 120000; // 120 seconds

// Initialize Socket.IO with options for WebSocket
const httpIo = socketIo(httpServer, {
    transports: ['websocket'], // Only use WebSocket transport
    allowUpgrades: false, // Disable upgrades
    pingInterval: 5000, // Ping every 5 seconds
    pingTimeout: 10000, // Timeout for ping response after 10 seconds
    cors: {
        origin: '*', // Allow all origins for CORS
    }
});

// Player management
const players = {}; // Object to store connected players
let connectionCount = 0; // Count of active connections

// Handle new socket connections
httpIo.on('connection', handleConnection);

// Serve the main EJS page for Game Dev Central Hub
app.get('/', (req, res) => {
    // Load metadata from a JSON file (if needed) or set dynamically for game dev context
    const metaTags = {
        title: 'Game Dev Central Hub',
        description: 'Create your own pixel-based side scroller games and share them with others!',
        keywords: 'game dev, pixel art, side scroller, multiplayer, socket.io'
    };

    // Render the main EJS page
    res.render('index', { metaTags });
});

// Start HTTP server listening on port 80
httpServer.listen(80, () => console.log('HTTP Server listening on port 80'));

/**
 * Handle new socket connections
 * @param {Socket} socket - The connected socket instance
 */
function handleConnection(socket) {
    console.log(`Player ${socket.id} connected`); // Log new connection

    // Initialize new player and add to the players object
    const currentPlayer = initializePlayer(socket);
    players[socket.id] = currentPlayer;

    // Emit player data to the newly connected player
    emitPlayerData(socket);

    // Set up event listeners for player actions
    socket.on('playerMovement', handlePlayerMovement);
    socket.on('playerChat', handlePlayerChat);
    socket.on('disconnect', handlePlayerDisconnect);
}

/**
 * Initialize a new player object
 * @param {Socket} socket - The socket instance for the connected player
 * @returns {Object} - The initialized player object
 */
function initializePlayer(socket) {
    return {
        playerId: socket.id, // Unique ID for the player
        connectionNum: ++connectionCount, // Increment connection count
        gameData: { pos: [0, 0] }, // Initial player position
        chatMessage: '', // Store last chat message
    };
}

/**
 * Emit current player data to the client
 * @param {Socket} socket - The socket instance for the connected player
 */
function emitPlayerData(socket) {
    socket.emit('currentPlayer', players[socket.id]); // Send current player data

    // Send existing players data
    const existingPlayers = Object.values(players);
    socket.emit('existingPlayers', { existingPlayers });

    // Notify other clients of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);
}

/**
 * Handle player movement events
 * @param {Object} data - The movement data from the client
 */
function handlePlayerMovement(data) {
    // Update player's position based on the received data
    players[this.id].gameData.pos = data.pos;

    // Broadcast the new position to other players
    this.broadcast.emit('playerMoved', { player: players[this.id] });
}

/**
 * Handle player chat events
 * @param {string} message - The chat message sent by the player
 */
function handlePlayerChat(message) {
    // Update player's last chat message
    players[this.id].chatMessage = message;

    // Clear chat message after 30 seconds
    setTimeout(() => {
        players[this.id].chatMessage = '';
        this.emit('chatUpdate', { playerId: this.id, chatMessage: '' });
    }, 30000);

    // Broadcast the chat message to other players
    this.broadcast.emit('chatUpdate', { playerId: this.id, chatMessage: message });
}

/**
 * Handle player disconnection events
 */
function handlePlayerDisconnect() {
    console.log(`Player ${this.id} disconnected`);
    delete players[this.id]; // Remove player from the object

    // Notify other clients of the player's disconnection
    this.broadcast.emit('playerDisconnected', { playerId: this.id });
}