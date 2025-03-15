// Simple Express server to serve the Socket.IO test page
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3003;

// Serve the HTML test page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'socket-test.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test page server running at http://localhost:${PORT}`);
  console.log(`Open your browser to http://localhost:${PORT} to test the Socket.IO connection`);
}); 