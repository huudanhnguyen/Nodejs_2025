const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { generateToken, generateRefreshToken } = require('../middlewares/jwt');
const sendEmail = require('../ultils/sendMail'); // Import hàm gửi email
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
const logout = asyncHandler(async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
        return res.status(204).json({ success: true, message: 'No refresh token in cookies' });
    }
    
    // Xóa refresh token khỏi cookie
    res.clearCookie('refreshToken', { httpOnly: true, secure: true });
    
    // Cập nhật user để xóa refresh token trong cơ sở dữ liệu
    await User.findOneAndUpdate({ refreshToken: cookies.refreshToken }, { refreshToken: null });
    
    return res.status(200).json({ success: true, message: 'Logout successful' });
});
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    // 2. Tìm người dùng trong database
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(200).json({ 
            success: true, 
            message: 'If an account with this email exists, a password reset link has been sent.' 
        });
    }
    // 3. Tạo reset token và lưu vào user
    const resetToken = user.createPasswordResetToken();
    // Tạm thời lưu lại nhưng chưa commit hẳn, phòng trường hợp gửi mail lỗi
    await user.save({ validateBeforeSave: false });
    const html = `<p>Click <a href='${process.env.CLIENT_URL}/api/user/reset-password/${resetToken}'>here</a> to reset your password. This link will expire in 10 minutes.</p>`;
    // Chuẩn bị dữ liệu theo cấu trúc đã cải thiện ở file sendMail.js
    const data = {
        email, // Thay vì to: email
        html,
        subject: 'Password Reset Request'
    };
    // 5. Gửi email và xử lý kết quả
    const emailSent = await sendEmail(data);
    if (emailSent) {
        return res.status(200).json({ success: true, message: 'Password reset link sent to your email' });
    } else {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
    }
});

module.exports = { register, login, getUserProfile, refreshAccessToken, logout, forgotPassword };