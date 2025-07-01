const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3003",
    methods: ["GET", "POST"]
  }
});

const worlds = new Map();

io.on('connection', (socket) => {
  const worldId = socket.handshake.query.worldId;
  
  socket.join(worldId);
  
  if (!worlds.has(worldId)) {
    worlds.set(worldId, {
      users: [],
      messages: []
    });
  }
  
  const world = worlds.get(worldId);
  world.users.push(socket.id);
  
  socket.on('message', (message) => {
    world.messages.push(message);
    io.to(worldId).emit('message', message);
  });
  
  socket.on('disconnect', () => {
    const index = world.users.indexOf(socket.id);
    if (index > -1) {
      world.users.splice(index, 1);
    }
    
    if (world.users.length === 0) {
      worlds.delete(worldId);
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});