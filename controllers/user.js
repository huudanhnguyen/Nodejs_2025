const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { generateToken, generateRefreshToken } = require('../middlewares/jwt');
const register = asyncHandler(async (req, res) => {
    const {firstname, lastname, email, mobile, password} = req.body
    if (!firstname || !lastname || !email || !mobile || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required'
        });
    } 
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User already exists with this email'
        });
    }
            
    const newUser = await User.create(req.body)
    return res.status(200).json({
        message: 'User registered successfully',
        success: newUser ? true : false,
        newUser
    });

});
const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        // Update user's refresh token in the database
        await User.findByIdAndUpdate(user._id, { refreshToken }, { new: true });
        // Set the refresh token as a cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict', // Prevent CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }); 
        // Return the user data and token
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                mobile: user.mobile,
                token: token,
            }
        });
    } else {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

});

    const getUserProfile = asyncHandler(async (req, res) => {
    console.log("USER INFO FROM TOKEN:", req.user); 
    const userID = req.user; 
    const user = await User.findById(userID).select('-password -refreshToken -role'); 

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    return res.status(200).json({
        success: true,
        user
    });
});

// Trong file controllers/user.js

// File: controllers/user.js

const refreshAccessToken = asyncHandler(async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) throw new Error('No refresh token in cookies');

    // Bước 1: Xác thực refreshToken
    jwt.verify(cookies.refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decode) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
        }
        
        // ---- BƯỚC CẢI THIỆN: KIỂM TRA USER CÓ TỒN TẠI KHÔNG ----
        // Dùng ID đã giải mã để tìm user TRƯỚC KHI tạo token mới
        const user = await User.findById(decode.id);

        if (!user) {
            // Nếu không tìm thấy, từ chối tạo token mới và có thể xóa cookie rác
            res.clearCookie('refreshToken', { httpOnly: true, secure: true });
            return res.status(401).json({ success: false, message: "User for this token no longer exists." });
        }
        // ---------------------------------------------------------
        
        // Nếu user tồn tại, mới tạo accessToken mới
        const newAccessToken = generateToken(user);
        
        return res.status(200).json({
            success: true,
            newAccessToken: newAccessToken
        });
    });
});

module.exports = { register, login, getUserProfile, refreshAccessToken };