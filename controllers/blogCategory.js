const BlogCategory = require('../models/blogCategory');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const createBlogCategory = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const categoryExists = await BlogCategory.findOne({ title });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category with this title already exists');
  }

  const category = await BlogCategory.create({
    title,
    description,
    slug: slugify(title, { lower: true }),
  });

  if (category) {
    res.status(201).json({
      _id: category.id,
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
const getBlogCategories = asyncHandler(async (req, res) => {
  const categories = await BlogCategory.find({});
    res.status(200).json(categories);
});
const updateBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const category = await BlogCategory.findById(id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
    }
    if (title) {
    const categoryExists = await BlogCategory.findOne({ title, _id: { $ne: id } });
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
const deleteBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedCategory = await BlogCategory.findByIdAndDelete(id);
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
  createBlogCategory,
  getBlogCategories,
  updateBlogCategory,
  deleteBlogCategory,
};