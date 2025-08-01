// models/coupon.model.js
const mongoose = require('mongoose');
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Mã coupon là bắt buộc'],
        unique: true, // Đảm bảo mã coupon là duy nhất
        trim: true,
        uppercase: true // Tự động chuyển thành chữ hoa
    },
    description: {
        type: String,
        required: [true, 'Mô tả là bắt buộc']
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed_amount'] // Chỉ chấp nhận 1 trong 2 giá trị này
    },
    discountValue: {
        type: Number,
        required: [true, 'Giá trị giảm giá là bắt buộc']
    },
    expiryDate: {
        type: Date,
        required: [true, 'Ngày hết hạn là bắt buộc']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number,
        default: null // null nghĩa là không giới hạn
    },
    timesUsed: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Thêm một phương thức ảo để kiểm tra coupon có hết hạn hay không
couponSchema.virtual('isExpired').get(function() {
    return this.expiryDate < new Date();
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;