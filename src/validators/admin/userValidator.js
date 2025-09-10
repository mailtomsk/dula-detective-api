import { body } from 'express-validator';

export const createUserValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('plan').notEmpty().withMessage('Subscripton type is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('is_active').optional()
];

export const updateUserValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('plan').notEmpty().withMessage('Subscripton type is required'),    
  body('is_active').optional()
];
