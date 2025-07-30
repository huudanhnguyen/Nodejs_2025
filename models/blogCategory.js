const moongose = require('mongoose');
const blogCategorySchema = new moongose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
    set: (v) => v.toLowerCase().replace(/\s+/g, '-'),
  },
    description: {
    type: String,
    required: false,
  },
    createdAt: {
    type: Date,
    default: Date.now,
  },
    updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
    versionKey: false,
});

module.exports = moongose.model('BlogCategory', blogCategorySchema);