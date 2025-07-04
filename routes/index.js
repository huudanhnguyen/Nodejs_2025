// server/routes/index.js

const userRouter = require('./user');
const { notFound, errorHandler } = require('../middlewares/errHandler');

const initRoutes = (app) => {
    app.use('/api/user', userRouter);
    // Add other routes here as needed

    // Middleware xử lý khi không tìm thấy route (404)
    app.use(notFound);
    
    // Middleware xử lý lỗi tổng quát (phải đặt cuối cùng)
    app.use(errorHandler); 
};

module.exports = initRoutes;