let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}

function getIO() {
  return ioInstance;
}

/**
 * Broadcast event to all connected clients
 */
function emitEvent(eventName, payload) {
  if (ioInstance) {
    ioInstance.emit(eventName, payload);
    console.log(`📡 [Socket.io] Emitted event: ${eventName}`, payload ? { type: payload.type, id: payload.id } : '');
  }
}

module.exports = {
  initSocket,
  getIO,
  emitEvent,
};
