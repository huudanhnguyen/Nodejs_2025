const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Brand title is required'],
        unique: true,
        index: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },
}, {
    timestamps: true,
});


module.exports = mongoose.model('Brand', brandSchema);