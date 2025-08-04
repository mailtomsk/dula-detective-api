import { verifyToken } from '../utils/jwt.js';
import { error } from '../utils/apiResponse.js';

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Missing or invalid token', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return error(res, 'Token expired or invalid', 401);
  }
}
