const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { initializeDatabase } = require('./src/config/db');
const app = require('./src/app');
const { initSocket } = require('./src/services/socketService');
const { startReminderScheduler, stopReminderScheduler } = require('./src/services/reminderScheduler');

const PORT = parseInt(process.env.PORT || '8080', 10);

const server = http.createServer(app);

// Initialize Socket.io with CORS support
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  transports: ['websocket', 'polling'],
});

initSocket(io);

// Start server immediately so cloud health checks succeed without delay
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Digital Udhaar Khata Real-Time Engine is LIVE!`);
  console.log(`   Backend API:    http://localhost:${PORT}/api/v1`);
  console.log(`   Socket.io:      ws://localhost:${PORT}`);
  console.log(`   Scheduler:      node-cron automated reminder checks active`);
  console.log(`======================================================\n`);
});

// Initialize database schema and start scheduler
(async () => {
  try {
    await initializeDatabase();
    startReminderScheduler();
  } catch (err) {
    console.error('⚠️ Database init or scheduler warning:', err.message);
  }
})();

// Graceful termination handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing services...');
  stopReminderScheduler();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, closing services...');
  stopReminderScheduler();
  server.close(() => process.exit(0));
});
