// file: middlewares/verifyToken.js (hoặc đổi tên thành authHandler.js)

const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Middleware 1: Chỉ xác thực token và lấy user
const verifyToken = asyncHandler(async (req, res, next) => {
    let token;
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                req.user = user;
                next();
            }
        } catch (error) {
            // Nếu token sai hoặc hết hạn, báo lỗi 401
            res.status(401);
            throw new Error('Not Authorized, token expired or invalid');
        }
    } else {
        res.status(401);
        throw new Error('There is no token attached to header');
    }
});

// Middleware 2: Chỉ kiểm tra quyền admin
const isAdmin = asyncHandler(async (req, res, next) => {
    // req.user đã được gán từ middleware 'authMiddleware' chạy trước đó
    const { role } = req.user;
    if (role !== 'admin') {
        // Dòng 41 của bạn nằm ở đây. Giờ chúng ta sẽ xử lý nó đúng cách
        res.status(401); // Đặt status code là 401
        throw new Error('Not authorized as an admin'); // Throw lỗi, errorHandler sẽ bắt
    } else {
        next();
    }
});

module.exports = { verifyToken, isAdmin };