const mongoose = require('mongoose');

// Định nghĩa Schema cho một đơn hàng
const orderSchema = new mongoose.Schema({
    // Mảng các sản phẩm trong đơn hàng
    products: [
        {
            product: { type: mongoose.Types.ObjectId, ref: 'Product' },
            quantity: Number,
            color: String,
            price: Number // Lưu lại giá tại thời điểm đặt hàng
        }
    ],
    // Trạng thái đơn hàng
    status: {
        type: String,
        default: 'Processing', // Trạng thái mặc định là "Đang xử lý"
        enum: ['Cancelled', 'Processing', 'Succeed'] // Các trạng thái hợp lệ
    },
    paymentIntent: {
        type: String,
        default: null // Mã thanh toán, có thể để null nếu không sử dụng
    },
    // Tổng giá trị đơn hàng
    total: Number,
    // Thông tin người đặt hàng
    orderBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Export model
module.exports = mongoose.model('Order', orderSchema);