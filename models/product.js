const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    brand: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductCategory',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
    },
    sold: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    imageUrl: {
        type: String,
        default: '',
    },
    images: [
        {
            type: Array,
            default: [],
        },
    ],
    colors:{
        type: [String],
        enum: ['red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 'orange'],
    },
    ratings: [
        {
            star: Number,
            comment: String,
            postedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
             postedAt: Date
        }
    ],
    totalRating: {
        type: Number,
        default: 0,
    },
    totalSold: {
        type: Number,
        default: 0,
    },
    countInStock: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

productSchema.virtual('formattedPrice').get(function() {
    if (this.price == null) {
        return '';
    }
    // Sử dụng toLocaleString, một cách nhanh hơn của Intl.NumberFormat
    return this.price.toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND'
    });
});

module.exports = mongoose.model('Product', productSchema);