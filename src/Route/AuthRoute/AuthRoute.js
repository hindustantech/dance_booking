import express from 'express';
import {
    register,
    verifyOTP,
    login,
    verifyLoginOTP,
    logout,
    refreshToken,
    getArchestraUsers
} from '../../Controller/AuthController/AuthController.js';
import { protect } from '../../Middleware/authMiddleware.js';

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', register);

// @desc    Verify OTP for registration
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', verifyOTP);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', login);

// @desc    Verify login OTP
// @route   POST /api/auth/verify-login-otp
// @access  Public
router.post('/verify-login-otp', verifyLoginOTP);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, logout);

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
router.post('/refresh-token', refreshToken);

// @desc    Get paginated, searchable list of users with role 'archestra', verified users on top
// @route   GET /api/auth/archestra
// @access  Private/Admin (or as per your auth logic)
router.get('/archestra', protect, getArchestraUsers);

export default router;