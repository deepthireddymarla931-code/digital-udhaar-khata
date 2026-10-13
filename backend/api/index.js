const app = require('../src/app');
const { initializeDatabase } = require('../src/config/db');

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('Database connection error in Vercel Serverless:', err.message);
    }
  }
  return app(req, res);
};
