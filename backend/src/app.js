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

// Health Check, Browser Welcome Page & System Status
app.get(['/', '/api/v1', '/api/v1/health'], (req, res) => {
  const wantsHtml = req.headers.accept && req.headers.accept.includes('text/html');

  if (wantsHtml) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Digital Udhaar Khata — Backend Engine</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
          body { background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
          .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 40px; max-width: 540px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center; }
          .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; color: #34d399; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; }
          .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
          h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #f1f5f9; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
          .btn { display: block; width: 100%; padding: 14px; background: #4f46e5; color: white; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4); transition: all 0.2s; }
          .btn:hover { background: #4338ca; transform: translateY(-1px); }
          .endpoints { margin-top: 28px; padding-top: 20px; border-top: 1px solid #1e293b; text-align: left; }
          .endpoints h3 { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px; }
          .endpoints code { display: block; font-size: 12px; color: #818cf8; background: #020617; padding: 6px 10px; border-radius: 8px; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge"><span class="dot"></span> Backend Engine Online</div>
          <h1>Digital Udhaar Khata</h1>
          <p>You have reached the REST & Real-Time Sync backend API. To use the application, click the button below to open the frontend web interface.</p>
          <a class="btn" href="https://digital-udhaar-frontend.onrender.com">👉 Open Frontend Web Application</a>
          <div class="endpoints">
            <h3>API Status</h3>
            <code>GET /api/v1/health &bull; Status: UP</code>
            <code>Database &bull; MySQL (Aiven Cloud)</code>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  res.json({
    status: 'UP',
    database: 'MySQL (udhaar_db)',
    service: 'Digital Udhaar Khata REST & Real-Time Sync Engine',
    version: '2.0.0',
    frontendUrl: 'https://digital-udhaar-frontend.onrender.com',
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

const path = require('path');
const fs = require('fs');

// Serve static frontend SPA build if present
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 Handler for API
app.use((req, res) => {
  res.status(404).json({ message: `Endpoint ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

module.exports = app;
