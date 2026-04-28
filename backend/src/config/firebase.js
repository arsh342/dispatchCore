/**
 * Firebase Admin SDK Configuration
 *
 * Initializes firebase-admin for server-side operations:
 *   - Auth: Verify ID tokens, set custom claims
 *   - RTDB: Push real-time events (replaces Socket.io)
 *   - Messaging: Send FCM push notifications
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH env var pointing to
 * the downloaded service account JSON key file.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

/**
 * Resolve and validate the service account key file.
 * @returns {object} Parsed service account JSON
 */
function loadServiceAccount() {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!envPath) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_PATH is not set. ' +
        'Download a service account key from Firebase Console → Project Settings → Service Accounts.',
    );
  }

  const resolvedPath = path.isAbsolute(envPath)
    ? envPath
    : path.resolve(__dirname, '..', '..', envPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase service account file not found at: ${resolvedPath}`);
  }

  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

/**
 * Initialize the Firebase Admin app (singleton).
 * Safe to call multiple times — returns existing instance if already initialized.
 */
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!databaseURL) {
    throw new Error(
      'FIREBASE_DATABASE_URL is not set. ' +
        'Find it in Firebase Console → Realtime Database → Data tab (e.g. https://<project>.firebaseio.com).',
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
  });

  logger.info('Firebase Admin SDK initialized');
  return admin.app();
}

// Initialize on first import
initializeFirebase();

module.exports = {
  admin,
  auth: admin.auth(),
  db: admin.database(),
  messaging: admin.messaging(),
};
