import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Generates a JWT token for a user using their user_id
 * @param userId - The user's 4-digit user_id
 * @returns string - JWT token
 */
export const generateJWTToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Generates a JWT token with user_id format (same as traditional auth)
 * @param userId - The user's 4-digit user_id
 * @returns string - JWT token in format "user_id_<userId>"
 */
export const generateUserIdToken = (userId: string): string => {
  return `user_id_${userId}`;
};

/**
 * Verifies a JWT token and extracts the user_id
 * @param token - JWT token
 * @returns string | null - The user_id if valid, null if invalid
 */
export const verifyJWTToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch (error) {
    return null;
  }
};
