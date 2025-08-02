import express from 'express';
import { validate } from '../../middlewares/validate.js';
import { createUserValidator, updateUserValidator } from '../../validators/admin/userValidator.js';
import authenticateToken from '../../middlewares/adminAuthMiddleware.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../../controllers/admin/userController.js';

const router = express.Router();

router.get('/', authenticateToken, getUsers);
router.get('/:id', authenticateToken, getUserById);
router.post('/', authenticateToken, createUserValidator, validate, createUser);
router.put('/:id', authenticateToken, updateUserValidator, validate, updateUser);
router.delete('/:id', authenticateToken, deleteUser);
router.patch('/:id/toggle-status', authenticateToken, toggleUserStatus);

export default router;
