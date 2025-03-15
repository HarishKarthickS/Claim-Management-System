// Simple test script to emit events to our Socket.IO server
const axios = require('axios');

// Function to emit a test event
async function emitTestEvent() {
  try {
    const response = await axios.post('http://localhost:3000/api/socket/emit', {
      event: 'testEvent',
      data: {
        message: 'This is a test message',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('Event emitted successfully:', response.data);
  } catch (error) {
    console.error('Failed to emit event:', error.message);
  }
}

// Emit a test event every 5 seconds
console.log('Starting test script to emit events...');
setInterval(emitTestEvent, 5000);

// Emit one immediately
emitTestEvent(); 