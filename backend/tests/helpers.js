import jwt from 'jsonwebtoken';
import { clearDatabase } from './jest-clear-db.js';

/**
 * Generates a valid stateless test token for passport-jwt extraction.
 * @param {string} userId - The target user UUID to store in the token payload.
 * @returns {string} Fully signed Authorization bearer string.
 */
export const generateTestToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
};

export { clearDatabase };
