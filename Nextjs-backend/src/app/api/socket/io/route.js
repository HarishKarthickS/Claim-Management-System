import { NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

// Global variable to store the Socket.IO instance
let io;

// Helper function to emit events to all connected clients
function emitEvent(event, data) {
  if (global.io) {
    console.log(`Emitting ${event}:`, data);
    global.io.emit(event, data);
    return true;
  }
  console.warn(`Failed to emit ${event}: Socket.IO server not initialized`);
  return false;
}

// Attach emitEvent to global scope
global.emitSocketEvent = emitEvent;

export async function GET(req) {
  try {
    if (!io) {
      console.log('Setting up Socket.IO server...');
      
      // Create a new Socket.IO server if it doesn't exist
      io = new SocketIOServer({
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
          allowedHeaders: ["Content-Type", "Authorization"],
          credentials: true,
        },
      });
      
      // Add connection handlers
      io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        
        // Send a welcome message
        socket.emit('welcome', { message: 'Connected to claims management system' });
        
        // Handle disconnection
        socket.on('disconnect', (reason) => {
          console.log('Client disconnected:', socket.id, reason);
        });
      });
      
      // Store io instance globally
      global.io = io;
      
      console.log('Socket.IO server initialized successfully');
    } else {
      console.log('Socket.IO server already initialized');
    }
    
    return new NextResponse(
      JSON.stringify({ success: true, message: 'Socket.IO server is running' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Socket.IO server failed to initialize' }),
      { status: 500 }
    );
  }
} 