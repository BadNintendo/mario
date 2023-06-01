// server.js
const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

// Initialize app
const app = express();

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP and HTTPS servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer({
  key: fs.readFileSync('./server.key', 'utf8'),
  cert: fs.readFileSync('./server.crt', 'utf8')
}, app);

const httpIo = socketIo(httpServer);
const httpsIo = socketIo(httpsServer);



// Player state
const players = {};
let connectionCount = 0;

// Connection handling
httpIo.on('connection', handleConnection);
httpsIo.on('connection', handleConnection);

// Start servers
httpServer.listen(80, () => console.log('HTTP Server listening on port 80'));
httpsServer.listen(443, () => console.log('HTTPS Server listening on port 443'));

// Handle socket connections
function handleConnection(socket) {
    console.log(`Player ${socket.id} connected`);

    const currentPlayer = initializePlayer(socket);
    players[socket.id] = currentPlayer;

    emitPlayerData(socket);

    socket.on('playerMovement', handlePlayerMovement);
    socket.on('playerChat', handlePlayerChat);
    socket.on('disconnect', handlePlayerDisconnect);
}

// Initialize a new player
function initializePlayer(socket) {
    return {
        playerId: socket.id,
        connectionNum: ++connectionCount,
        gameData: { pos: [0, 0] },
        chatMessage: '',
    };
}

// Emit player data to clients
function emitPlayerData(socket) {
    socket.emit('currentPlayer', players[socket.id]);

    const existingPlayers = Object.values(players);
    socket.emit('existingPlayers', { existingPlayers });

    socket.broadcast.emit('newPlayer', players[socket.id]);
}

// Handle player movement events
function handlePlayerMovement(data) {
    players[this.id].gameData.pos = data.pos;
    this.broadcast.emit('playerMoved', { player: players[this.id] });
}

// Handle player chat events
function handlePlayerChat(message) {
    players[this.id].chatMessage = message;
    
    setTimeout(() => {
        players[this.id].chatMessage = '';
        this.emit('chatUpdate', { playerId: this.id, chatMessage: '' });
    }, 30000);

    this.broadcast.emit('chatUpdate', { playerId: this.id, chatMessage: message });
}

// Handle player disconnect events
function handlePlayerDisconnect() {
    console.log(`Player ${this.id} disconnected`);
    delete players[this.id];
    this.broadcast.emit('playerDisconnected', this.id);
}