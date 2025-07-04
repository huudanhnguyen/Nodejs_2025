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
    // Sửa dòng này:
    const userID = req.user; // Lấy trực tiếp ID vì middleware verifyToken đã gán nó vào đây

    const user = await User.findById(userID).select('-password -refreshToken -role'); // Loại bỏ các trường nhạy cảm

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

const refreshAccessToken = asyncHandler(async (req, res) => {
    console.log("COOKIE NHẬN ĐƯỢC TỪ POSTMAN:", req.cookies);
    const cookies = req.cookies;
    if (!cookies || !cookies.refreshToken) {
        throw new Error('No refresh token in cookies');
    }

    jwt.verify(cookies.refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decode) => {
        if (err) {
            // In ra lỗi thật sự từ thư viện JWT để biết lý do
            console.error("JWT VERIFY ERROR:", err); 
            // Bạn có thể trả về lỗi cho client hoặc throw lỗi như cũ
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token."
            });
        }
        // ---- KẾT THÚC SỬA ----

        // Tìm user trong DB, nhưng bây giờ tìm bằng ID từ token đã giải mã
        const user = await User.findOne({ _id: decode.id });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        // TẠO ACCESS TOKEN MỚI
        const newAccessToken = generateToken({ id: user._id, role: user.role });
        
        return res.status(200).json({
            success: true,
            newAccessToken: newAccessToken
        });
    });
});

module.exports = { register, login, getUserProfile, refreshAccessToken };