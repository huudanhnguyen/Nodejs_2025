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
        type: String,
        required: true,
        trim: true,
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
    image: {
        type: String,
        default: 'https://plus.unsplash.com/premium_photo-1684581214880-2043e5bc8b8b?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YmxvZyUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D',
    },
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
