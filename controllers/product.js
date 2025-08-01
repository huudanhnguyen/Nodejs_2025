const { json, response } = require('express');
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

    // field limiting
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields);
    } else {
        queryCommand = queryCommand.select('-__v');
    }

    // pagination
    const page = +(req.query.page) || 1;
    const limit = +(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    queryCommand = queryCommand.skip(skip).limit(limit);

    // execute the query
    const response = await queryCommand.exec();
    const counts = await Product.countDocuments(finalQuery);
    return res.status(200).json({
    success: response.length > 0,
    message: response.length > 0 ? 'Products fetched successfully' : 'No products found',
    totalCount: counts,
    currentPage: page,
    totalPages: Math.ceil(counts / limit),
    products: response,
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
const ratings = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, comment, productId, postedAt } = req.body;
    if (!star || !productId) {
        return res.status(400).json({ status: false, message: 'Missing inputs' });
    }
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ status: false, message: 'Product not found' });
    }
    // 3. Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const alreadyRated = product.ratings.find(
        (rating) => rating.postedBy && rating.postedBy.equals(_id)
    );
    if (alreadyRated) {
        // --- TRƯỜNG HỢP 1: NGƯỜI DÙNG ĐÃ ĐÁNH GIÁ -> CẬP NHẬT LẠI ---
        // Tính toán sự chênh lệch điểm star để cập nhật tổng điểm
        const ratingDifference = star - alreadyRated.star;
        // Dùng `updateOne` với `arrayFilters` để cập nhật chính xác phần tử trong mảng
        await Product.updateOne(
            { 
                _id: productId, 
                "ratings.postedBy": _id 
            },
            {
                // Cập nhật điểm star và comment của đánh giá cũ
                $set: { "ratings.$.star": star, "ratings.$.comment": comment, "ratings.$.postedAt": new Date() },
                // Cập nhật lại tổng điểm rating bằng cách cộng thêm phần chênh lệch
                $inc: { totalRating: ratingDifference }
            }
        );
    } else {
        // --- TRƯỜNG HỢP 2: NGƯỜI DÙNG ĐÁNH GIÁ LẦN ĐẦU -> THÊM MỚI ---
        // Dùng `findByIdAndUpdate` để thực hiện các thao tác một cách nguyên tử
        await Product.findByIdAndUpdate(productId, {
            // Thêm một đánh giá mới vào mảng ratings
            $push: { 
                ratings: { star, comment, postedBy: _id, postedAt: new Date() } 
            },
            // Tăng tổng số điểm và tổng số lượt đánh giá
            $inc: { totalRating: star, totalRatings: 1 }
        });
    }
    // Lấy lại sản phẩm đã được cập nhật để trả về cho client
    const updatedProduct = await Product.findById(productId);
    // Tính toán lại tổng điểm rating
    const ratingsCount = updatedProduct.ratings.length;
    const sumRatings = updatedProduct.ratings.reduce((sum, rating) => sum + +rating.star, 0);
    updatedProduct.totalRating = Math.round(sumRatings *10/ratingsCount)/10;
    await updatedProduct.save();
    // Trả về phản hồi thành công
    return res.status(200).json({
        status: true,
        message: "Rating updated successfully",
        product: updatedProduct
    });
});
const uploadImageProduct = asyncHandler(async (req, res) => {
    console.log(req.file);
    const imagePath = req.file ? req.file.path : null; 
    
    return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        image: imagePath
    });
});
module.exports = {
    createProduct,
    getProduct,
    getAllProducts,
    deleteProduct,
    updateProduct,
    ratings,
    uploadImageProduct
};  