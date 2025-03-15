import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';

// Create express app
const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Send welcome message
  socket.emit('welcome', { message: 'Connected to claims management system' });
  
  // Custom authentication middleware
  socket.on('authenticate', (userData) => {
    if (userData && userData.id) {
      console.log('User authenticated:', userData.id);
      socket.user = userData;
      socket.join(`user:${userData.id}`);
      socket.emit('authenticated', { success: true });
    } else {
      console.log('Authentication failed');
      socket.emit('authenticated', { success: false });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, reason);
  });
});

// Expose method to emit events
export function emitToAll(event, data) {
  if (!io) {
    console.warn(`Cannot emit ${event}: Socket.IO server not initialized`);
    return false;
  }
  
  console.log(`Emitting ${event} to all clients:`, data);
  io.emit(event, data);
  return true;
}

export function emitToUser(userId, event, data) {
  if (!io) {
    console.warn(`Cannot emit ${event} to user ${userId}: Socket.IO server not initialized`);
    return false;
  }
  
  console.log(`Emitting ${event} to user ${userId}:`, data);
  io.to(`user:${userId}`).emit(event, data);
  return true;
}

// Variable to track if server is already running
let isServerRunning = false;

// Function to start the server safely
function startSocketServer() {
  if (isServerRunning) {
    console.log('Socket.IO server is already running');
    return;
  }
  
  // Use port 3003 to avoid conflict with Next.js (3000) and other services
  const PORT = process.env.SOCKET_PORT || 3003;
  
  try {
    server.listen(PORT, () => {
      console.log(`Socket.IO server is running on port ${PORT}`);
      isServerRunning = true;
    });
    
    // Handle errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Socket.IO server not started.`);
      } else {
        console.error('Socket.IO server error:', error);
      }
    });
  } catch (error) {
    console.error('Failed to start Socket.IO server:', error);
  }
}

// Start the server when this module is imported
startSocketServer();

export default io; 