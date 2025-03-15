/**
 * Socket.IO utility functions for use with Next.js App Router
 */

/**
 * Emits an event to all connected Socket.IO clients
 * @param {string} event - The event name
 * @param {any} data - The data to send
 * @returns {boolean} - Whether the event was emitted successfully
 */
export function emitEvent(event, data) {
  // Check if the global emitSocketEvent function exists
  if (typeof global.emitSocketEvent === 'function') {
    return global.emitSocketEvent(event, data);
  }
  
  // Try to access the global io instance directly if emitSocketEvent is not available
  if (global.io) {
    try {
      global.io.emit(event, data);
      console.log(`Emitted ${event}:`, data);
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      return false;
    }
  }
  
  // If Socket.IO hasn't been initialized yet
  console.warn(`Cannot emit ${event}: Socket.IO server not initialized`);
  return false;
}

/**
 * Initializes the Socket.IO client
 * Makes a request to the socket/io endpoint to ensure the Socket.IO server is running
 */
export async function initializeSocketClient() {
  try {
    const response = await fetch('/api/socket/io');
    const data = await response.json();
    console.log('Socket.IO initialization:', data);
    return data.success;
  } catch (error) {
    console.error('Failed to initialize Socket.IO client:', error);
    return false;
  }
} 