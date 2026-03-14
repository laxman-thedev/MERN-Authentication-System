// =======================
// controllers/authController.js
// =======================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/User.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js'

// -----------------------
// Register new user
// -----------------------
export const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required', success: false });
    }

    try {
        // check existing user
        const existingUser = await userModel.findOne({ email });
        if (existingUser) return res.status(200).json({ error: 'Email already in use', success: false });

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create and save new user
        const newUser = new userModel({ name, email, password: hashedPassword });
        await newUser.save();

        // generate JWT & set cookie
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // send welcome email
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Our Service',
            text: `Hello ${name},\n\nThank you for registering!`
        });

        res.status(201).json({ message: 'User registered successfully', success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
};

// -----------------------
// Login user
// -----------------------
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(200).json({ error: 'Email and password are required', success: false });

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(200).json({ error: 'Invalid email or password', success: false });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(200).json({ error: 'Invalid password', success: false });

        // issue token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: 'Login successful', success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
};

// -----------------------
// Logout user (clear cookie)
// -----------------------
export const logout = (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        return res.status(200).json({ message: 'Logout successful', success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', success: false });
    }
};

// -----------------------
// Send OTP for email verification
// -----------------------
export const sendVerifyOtp = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found', success: false });
        if (user.isVerified) return res.status(400).json({ error: 'User already verified', success: false });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verifyOtp = otp;
        user.verifyOtpExpiresAt = Date.now() + 30 * 60 * 1000; // 30 mins
        await user.save();

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        });

        res.status(200).json({ message: 'OTP sent to email', success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
};

// -----------------------
// Verify email with OTP
// -----------------------
export const verifyEmail = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await userModel.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found', success: false });
        if (user.verifyOtp !== otp || user.verifyOtp === '') return res.status(400).json({ error: 'Invalid OTP', success: false });
        if (user.verifyOtpExpiresAt < Date.now()) return res.status(400).json({ error: 'OTP has expired', success: false });

        user.isVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpiresAt = 0;
        await user.save();

        res.status(200).json({ message: 'Account verified successfully', success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
};

// -----------------------
// Check if user is authenticated
// -----------------------
export const isAuthenticated = async (req, res) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Login Again', success: false });

        const user = await userModel.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found', success: false });

        res.status(200).json({ message: 'User is authenticated', success: true, user });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
};

// -----------------------
// Send OTP for password reset
// -----------------------
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required', success: false });

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found', success: false });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpiresAt = Date.now() + 30 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        });

        res.status(200).json({ message: 'Password reset OTP sent to email', success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
};

// -----------------------
// Reset password using OTP
// -----------------------
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP and new password are required', success: false });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found', success: false });
        if (user.resetOtp !== otp || user.resetOtp === '') return res.status(400).json({ error: 'Invalid OTP', success: false });
        if (user.resetOtpExpiresAt < Date.now()) return res.status(400).json({ error: 'OTP has expired', success: false });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpiresAt = 0;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully', success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
};
