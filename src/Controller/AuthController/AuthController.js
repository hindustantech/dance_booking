import User from '../../Modle/user/User.js';
import sendEmail from '../../Utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, groupName, Specialties, email, phone, address, password, role, deviceInfo } = req.body;
        console.log(req.body);

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Validate required fields based on role
        if (role === 'archestra' && (!groupName || !Specialties)) {
            return res.status(400).json({
                success: false,
                message: 'Group name and Specialties are required for archestra role'
            });
        }

        // Create user with location (default coordinates)
        const userData = {
            name,
            email,
            phone,
            address,
            password,
            role,
            deviceInfo,
            location: {
                type: 'Point',
                coordinates: [0, 0] // Default coordinates
            }
        };

        // Add role-specific fields
        if (role === 'archestra') {
            userData.groupName = groupName;
            userData.Specialties = Specialties;
        }

        const user = await User.create(userData);

        // Generate OTP
        const otp = user.generateOTP();
        await user.save();

        // Send verification email
        const message = `Your verification OTP is: ${otp}\nThis OTP will expire in 10 minutes.`;

        try {
            await sendEmail(
                user.email,
                'Account Verification OTP',
                message
            );

            res.status(201).json({
                success: true,
                message: `OTP sent to ${user.email}`,
                userId: user._id
            });
        } catch (error) {
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({
                success: false,
                message: 'Email could not be sent'
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public

export const verifyOTP = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId).select('+otp +otpExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user'
            });
        }

        // Hash the provided OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        if (hashedOTP !== user.otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate tokens
        const accessToken = user.getAccessToken();
        const refreshToken = user.getRefreshToken();

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Account not verified. Please verify your email first.'
            });
        }

        // Generate OTP for 2-step verification
        const otp = user.generateOTP();
        await user.save();

        // Send OTP email
        const message = `Your login OTP is: ${otp}\nThis OTP will expire in 10 minutes.`;

        await sendEmail(
            user.email,
            'Account Verification OTP',
            message
        );

        res.status(200).json({
            success: true,
            message: `OTP sent to ${user.email}`,
            userId: user._id
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify login OTP
// @route   POST /api/auth/verify-login-otp
// @access  Public

export const verifyLoginOTP = async (req, res, next) => {
    try {
        const { userId, otp, deviceInfo } = req.body;

        const user = await User.findById(userId).select('+otp +otpExpires +refreshToken');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user'
            });
        }

        // Hash the provided OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        if (hashedOTP !== user.otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpires = undefined;

        // If user is already logged in from another device, invalidate previous tokens
        if (user.deviceInfo && user.deviceInfo.deviceId !== deviceInfo.deviceId) {
            user.refreshToken = undefined;
        }

        // Generate new tokens
        const accessToken = user.getAccessToken();
        const refreshToken = user.getRefreshToken();

        // Update device info
        user.deviceInfo = {
            deviceId: deviceInfo.deviceId,
            userAgent: deviceInfo.userAgent,
            ipAddress: req.ip,
            lastLogin: Date.now()
        };

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private

export const logout = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Clear tokens and device info
        user.refreshToken = undefined;
        user.deviceInfo = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public

export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const accessToken = user.getAccessToken();

        res.status(200).json({
            success: true,
            accessToken
        });
    } catch (error) {
        next(error);
    }
};