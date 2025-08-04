const moongose = require('mongoose');

const productCategorySchema = new moongose.Schema({
  title: {
    type: String,
    required: true,
    index: true,
  },
  brand: {
    type: [String],
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = moongose.model('ProductCategory', productCategorySchema);