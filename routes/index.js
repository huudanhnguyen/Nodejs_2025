const userRouter = require('./user');
const productRouter = require('./product');
const mongoose = require('mongoose')
const { notFound, errorHandler } = require('../middlewares/errHandler');

const initRoutes = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/product', productRouter);
    app.use('/api/product-categories', require('./productCategory'));
    app.use('/api/blog-categories', require('./blogCategory'));
    app.use('/api/blog', require('./blog'));
    app.use('/api/brand', require('./brand'));
    app.use('/api/coupon', require('./coupon'));
    app.use('/api/address', require('./address'));
    app.use(notFound);
        // Middleware xử lý lỗi tổng quát (phải đặt cuối cùng)
    app.use(errorHandler); 
};

module.exports = initRoutes;