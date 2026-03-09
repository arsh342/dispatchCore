/**
 * CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing for the Express app.
 * Allows the React frontend (Vercel) to communicate with the backend (Render).
 */

const cors = require('cors');
const env = require('./env');

const corsOptions = {
  origin: env.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'x-user-id', 'x-driver-id'],
};

module.exports = cors(corsOptions);
