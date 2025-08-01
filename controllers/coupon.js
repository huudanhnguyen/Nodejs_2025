const Coupon = require('../models/coupon');
const asyncHandler = require('express-async-handler');


const createCoupon = asyncHandler(async (req, res) => {
    const { code, discountValue, expiryDate } = req.body; 
    if (!code || !discountValue || !expiryDate) {
        throw new Error('Vui lòng cung cấp đầy đủ thông tin mã coupon');
    }
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        throw new Error('Mã coupon đã tồn tại');
    }
    const newCoupon = await Coupon.create({
        code: code.toUpperCase(),
        description: req.body.description || '',
        discountType: req.body.discountType || 'percentage',
        discountValue: req.body.discountValue,
        expiryDate: Date.now() + expiryDate * 24 * 60 * 60 * 1000, 
        isActive: req.body.isActive === undefined ? true : req.body.isActive,
        usageLimit: req.body.usageLimit || null,
    });
    res.status(201).json({
        success: true,
        coupon: newCoupon
    });
});


const getAllCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({})
    res.status(200).json(coupons);
});


const getCouponById = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        res.status(404);
        throw new Error('Không tìm thấy coupon');
    }

    res.status(200).json(coupon);
});


const updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        res.status(404);
        throw new Error('Không tìm thấy coupon');
    }
    if (req.body.expiryDate) {
        req.body.expiryDate = Date.now() + req.body.expiryDate * 24 * 60 * 60 * 1000; // Chuyển đổi ngày hết hạn từ ngày tính theo ngày sang timestamp
    }
    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json(updatedCoupon);
});


const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        res.status(404);
        throw new Error('Không tìm thấy coupon');
    }

    await coupon.deleteOne(); // Hoặc coupon.remove() với phiên bản Mongoose cũ hơn

    res.status(200).json({ message: 'Coupon đã được xóa thành công', id: req.params.id });
});

module.exports = {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
};