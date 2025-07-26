
import express from 'express'
const router = express.Router();
import authController from '../controllers/auth.controller.js'; // Assuming controller exists
import authMiddleware from '../middleware/auth.middleware.js'; // Assuming middleware exists

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user.
 * @access  Public
 * @body    { "email": "...", "password": "..." }
 */
router.post('/register', authController.registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and return a token.
 * @access  Public
 * @body    { "email": "...", "password": "..." }
 */
router.post('/login', authController.loginUser);

/**
 * @route   GET /api/auth/me
 * @desc    Get the details of the currently logged-in user.
 * @access  Private (Requires a valid token)
 */
router.get('/me', authMiddleware.protect, authController.getMe);


export default router;