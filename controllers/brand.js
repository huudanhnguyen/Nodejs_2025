// File: controllers/brand.js
const Brand = require('../models/brand');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

const createBrand = asyncHandler(async (req, res) => {
    if (!req.body.title) {
        res.status(400);
        throw new Error('Brand title is required');
    }
    if (req.body.title) {
        req.body.slug = slugify(req.body.title);
    }
    const existingBrand = await Brand.findOne({ title: req.body.title });
    if (existingBrand) {
        res.status(400);
        throw new Error('Brand already exists');
    }
    const newBrand = await Brand.create(req.body);
    res.status(201).json({
        success: true,
        message: 'Brand created successfully',
        brand: newBrand,
    });
});

const getAllBrands = asyncHandler(async (req, res) => {
    const brands = await Brand.find({});
    res.status(200).json({
        success: true,
        count: brands.length,
        brands,
    });
});

const getBrandById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const brand = await Brand.findById(id);

    if (!brand) {
        res.status(404);
        throw new Error('Brand not found');
    }

    res.status(200).json({
        success: true,
        brand,
    });
});

const updateBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!req.body.title) {
        res.status(400);
        throw new Error('Brand title is required for update');
    }
    // Nếu title được cập nhật, hãy cập nhật cả slug
    if (req.body.title) {
        req.body.slug = slugify(req.body.title);
    }
    const updatedBrand = await Brand.findByIdAndUpdate(id, req.body, {
        new: true, // Trả về document đã được cập nhật
        runValidators: true,
    });

    if (!updatedBrand) {
        res.status(404);
        throw new Error('Brand not found');
    }

    res.status(200).json({
        success: true,
        message: 'Brand updated successfully',
        brand: updatedBrand,
    });
});
const deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedBrand = await Brand.findByIdAndDelete(id);

    if (!deletedBrand) {
        res.status(404);
        throw new Error('Brand not found');
    }

    res.status(200).json({
        success: true,
        message: `Brand '${deletedBrand.title}' deleted successfully`,
    });
});


module.exports = {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
};