const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const aiRoutes = require('./routes/aiRoutes');
const statementRoutes = require('./routes/statementRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check & System Status
app.get(['/', '/api/v1', '/api/v1/health'], (req, res) => {
  res.json({
    status: 'UP',
    database: 'MySQL (udhaar_db)',
    service: 'Digital Udhaar Khata REST & Real-Time Sync Engine',
    version: '2.0.0',
    features: [
      'Instant Number-Based Khata Lookup & Auto-Creation',
      'Automated Due Date & Time Reminders (node-cron + SMS Dispatcher)',
      'Multi-Device Real-Time Sync (Socket.io)',
      'Market Split: You Will Give vs You Will Get',
      'AI NLP Natural Language Entry & Risk Scoring',
    ],
  });
});

// Mount modular API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/statements', statementRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Endpoint ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

module.exports = app;
