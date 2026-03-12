/**
 * CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing for the Express app.
 * Allows the React frontend (Vercel) to communicate with the backend (Render).
 */

const cors = require('cors');
const env = require('./env');

const allowedOrigins = env.frontendUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'x-driver-id'],
};

module.exports = cors(corsOptions);
