const ProductCategory = require('../models/productCategory');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
// @desc    Create a new product category
// @route   POST /api/product-categories
// @access  Private
const createProductCategory = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const categoryExists = await ProductCategory.findOne({ title });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category with this title already exists');
  }
  const category = await ProductCategory.create({
    title,
    description,
    slug: slugify(title, { lower: true }),
  });
  if (category) {
    res.status(201).json({
      _id: category._id,
      title: category.title,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  } else {
    res.status(400);
    throw new Error('Invalid category data');
  }
});
// @desc    Get all product categories
// @route   GET /api/product-categories
// @access  Public
const getProductCategories = asyncHandler(async (req, res) => {
  const categories = await ProductCategory.find({});
    res.status(200).json(categories);
});
// @desc    Update a product category
// @route   PUT /api/product-categories/:id
// @access  Private
const updateProductCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const category = await ProductCategory.findById(id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
    }
    if (title) {
    const categoryExists = await ProductCategory.findOne({ title, _id: { $ne: id } });
    if (categoryExists) {
      res.status(400);
      throw new Error('Category with this title already exists');
    }
  }
    category.title = title || category.title;
    category.description = description || category.description;
    category.slug = slugify(category.title, { lower: true });
    category.updatedAt = Date.now();
    await category.save();
    res.status(200).json(category);
});
// @desc    Delete a product category
// @route   DELETE /api/product-categories/:id
// @access  Private
const deleteProductCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedCategory = await ProductCategory.findByIdAndDelete(id);
  if (!deletedCategory) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.status(200).json({ 
    message: 'Category removed successfully',
    deletedCategory,
  });
});
module.exports = {
  createProductCategory,
  getProductCategories,
  updateProductCategory,
  deleteProductCategory,
};