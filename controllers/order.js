const Order = require('../models/order');
const User = require('../models/user');
const Coupon = require('../models/coupon');
const asyncHandler = require('express-async-handler');

// Hàm tạo đơn hàng mới
const createOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user; // Lấy id của người dùng đang đăng nhập (từ middleware)
    const { coupon } = req.body; // Lấy mã coupon nếu người dùng áp dụng

    // Tìm giỏ hàng của người dùng
    const userCart = await User.findById(_id).select('cart').populate('cart.product', 'title price');
    if (!userCart || userCart.cart.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Giỏ hàng của bạn đang trống'
        });
    }

    // Tính tổng tiền từ các sản phẩm trong giỏ hàng
    const products = userCart.cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        color: item.color,
        price: item.product.price // Lấy giá từ sản phẩm được populate
    }));
    let total = userCart.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    // Xử lý mã giảm giá (nếu có)
    const createData = { products, total, orderBy: _id };
    if (coupon) {
        const selectedCoupon = await Coupon.findById(coupon);
        if (selectedCoupon) {
            total = Math.round(total * (1 - selectedCoupon.discountValue / 100) / 1000) * 1000;
            createData.total = total;
            createData.coupon = coupon;
        }
    }

    // Tạo đơn hàng mới
    const newOrder = await Order.create(createData);

    // Sau khi tạo đơn hàng thành công, xóa giỏ hàng của người dùng
    if (newOrder) {
        await User.findByIdAndUpdate(_id, { cart: [] });
    }

    res.status(201).json({
        success: newOrder ? true : false,
        order: newOrder ? newOrder : 'Không thể tạo đơn hàng'
    });
});

// Hàm cập nhật trạng thái đơn hàng (cho Admin)
const updateStatus = asyncHandler(async (req, res) => {
    const { oid } = req.params; // Lấy id của đơn hàng từ URL
    const { status } = req.body; // Lấy trạng thái mới từ body

    if (!status) throw new Error('Trạng thái không được để trống');

    const updatedOrder = await Order.findByIdAndUpdate(oid, { status }, { new: true });

    res.json({
        success: updatedOrder ? true : false,
        order: updatedOrder ? updatedOrder : 'Không tìm thấy đơn hàng'
    });
});

// Hàm lấy đơn hàng của người dùng hiện tại
const getUserOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const orders = await Order.find({ orderBy: _id }).populate('products.product', 'title');

    res.json({
        success: orders ? true : false,
        orders: orders ? orders : 'Không tìm thấy đơn hàng nào'
    });
});

// Hàm lấy tất cả đơn hàng (cho Admin)
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().populate('products.product', 'title').populate('orderBy', 'firstname lastname');

    res.json({
        success: orders ? true : false,
        orders: orders ? orders : 'Không tìm thấy đơn hàng nào'
    });
});

module.exports = {
    createOrder,
    updateStatus,
    getUserOrder,
    getOrders
};