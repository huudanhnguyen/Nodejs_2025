const userRouter = require('./user');
const productRouter = require('./product');
const { notFound, errorHandler } = require('../middlewares/errHandler');

const initRoutes = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/product', productRouter);
    app.use('/api/product-categories', require('./productCategory'));
    app.use('/api/blog-categories', require('./blogCategory'));
    // Middleware xử lý khi không tìm thấy route (404)
    app.use(notFound);
    // Middleware xử lý lỗi tổng quát (phải đặt cuối cùng)
    app.use(errorHandler); 
};

module.exports = initRoutes;