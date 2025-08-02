const mongose = require('mongoose');
var blogSchema = new mongose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: mongose.Schema.Types.ObjectId,
        ref: 'BlogCategory',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    numberViews: {
        type: Number,
        default: 0,
    },
    likes:[
        {
            type: mongose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    dislikes:[
        {
            type: mongose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    images: [
        {
            type: Array,
            default: [],
        },
    ],
    author: {
        type: String,
        default: 'Admin',
    },
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: { virtuals: true,},
});
module.exports = mongose.model('Blog', blogSchema);
