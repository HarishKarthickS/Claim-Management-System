// Simple Socket.IO client test script
const { io } = require('socket.io-client');

// Connect to the Socket.IO server
const socket = io('http://localhost:3002', {
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to Socket.IO server with ID:', socket.id);
  
  // Send authentication data
  socket.emit('authenticate', {
    id: 'test-user-123',
    role: 'patient'
  });
});

socket.on('authenticated', (response) => {
  console.log('Authentication response:', response);
});

socket.on('welcome', (data) => {
  console.log('Received welcome message:', data);
});

// Listen for the test event
socket.on('testEvent', (data) => {
  console.log('Received test event:', data);
});

// Listen for claim events
socket.on('claimCreated', (data) => {
  console.log('Received claimCreated event:', data);
});

socket.on('claimUpdated', (data) => {
  console.log('Received claimUpdated event:', data);
});

socket.on('claimDeleted', (data) => {
  console.log('Received claimDeleted event:', data);
});

// Error handling
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from Socket.IO server. Reason:', reason);
});

// Keep the script running
console.log('Socket.IO client test script running. Press Ctrl+C to exit.'); 