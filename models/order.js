const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    products: [
        {
            product: { type: mongoose.Types.ObjectId, ref: 'Product' },
            quantity: Number,
            color: String,
            price: Number
        }
    ],
    status: {
        type: String,
        default: 'Processing',
        enum: ['Cancelled', 'Processing', 'Succeed']
    },
    paymentIntent: {
        type: String,
        default: null
    },

    total: Number,
    orderBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Export model
module.exports = mongoose.model('Order', orderSchema);