const crypto = require('crypto');

const ALGORITHM = 'scrypt';
const KEY_LENGTH = 64;

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${ALGORITHM}$${salt}$${hash}`;
};

const verifyPassword = (password, passwordHash) => {
  if (!passwordHash) {
    return false;
  }

  const [algorithm, salt, storedHash] = passwordHash.split('$');
  if (algorithm !== ALGORITHM || !salt || !storedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  const storedKey = Buffer.from(storedHash, 'hex');

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedKey, derivedKey);
};

module.exports = { hashPassword, verifyPassword };
