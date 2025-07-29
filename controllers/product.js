const { json } = require('express');
const Product = require('../models/product');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

const createProduct = asyncHandler(async (req, res) => {
    if(Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No data provided' });
    }
    if (req.body && req.body.title) {
        req.body.slug = slugify(req.body.title,{ lower: true });
    }
    const newProduct = await Product.create(req.body);
    return res.status(200).json({
        success: newProduct ? true : false,
        message: newProduct ? 'Product created successfully' : 'Failed to create product',
        newProduct: newProduct,
    });
});
const getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({
        success: true,
        message: 'Product fetched successfully',
        product: product,
    });
});
const getAllProducts = asyncHandler(async (req, res) => {
   const queries = {...req.query}
   const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queries[el]);

    const finalQuery = {};
    if (Object.keys(queries).length > 0) {
        let queryStr = JSON.stringify(queries);
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, match => `$${match}`);
        const parsedQuery = JSON.parse(queryStr);
        const numericFields = ['price', 'ratings'];
        for (const key in parsedQuery) {
            if (numericFields.includes(key)) {
                for (const operator in parsedQuery[key]) {
                    if (operator.startsWith('$')) {parsedQuery[key][operator] = parseFloat(parsedQuery[key][operator]);}
                }
            }
        }
        Object.assign(finalQuery, parsedQuery);
    }
    if (queries.title) {finalQuery.title = { $regex: queries.title, $options: 'i' };}
    if (queries.brand) {finalQuery.brand = { $regex: queries.brand, $options: 'i' };}
    let queryCommand = Product.find(finalQuery);
    //sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy);
    } else {
        queryCommand = queryCommand.sort('-createdAt');
    }
    const response = await queryCommand.exec();
    const counts = await Product.countDocuments(finalQuery);
    return res.status(200).json({
    success: response.length > 0,
    message: response.length > 0 ? 'Products fetched successfully' : 'No products found',
    products: response,
    totalCount: counts,
    });
});
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
    });
});
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    if (req.body && req.body.title) {
        product.slug = slugify(req.body.title, { lower: true });
    }
    return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product: product,
    });
});

module.exports = {
    createProduct,
    getProduct,
    getAllProducts,
    deleteProduct,
    updateProduct,
};  