const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// File: middlewares/verifyToken.js

const verifyToken = asyncHandler(async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    // Chỉ xử lý nếu header tồn tại và đúng định dạng
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            // Lấy token từ header
            token = authHeader.split(' ')[1];

            // Xác thực token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.id; // Gắn user vào request
            return next(); // Cho phép đi tiếp
        } catch (error) {
            // Token không hợp lệ (hết hạn, sai chữ ký, ...)
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    // Nếu không có token nào được cung cấp trong header
    return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
    });
});

module.exports = { verifyToken };
//