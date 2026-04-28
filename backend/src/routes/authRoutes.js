/**
 * Auth Routes (Firebase)
 *
 * POST /api/auth/session  — Create session after Firebase client-side auth
 * POST /api/auth/logout   — Acknowledge logout (client calls firebase.auth().signOut())
 */

const router = require('express').Router();
const { createSession, logout } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

// Session creation requires a valid Firebase ID token
router.post('/session', authLimiter, authMiddleware, createSession);
router.post('/logout', authLimiter, logout);

module.exports = router;
