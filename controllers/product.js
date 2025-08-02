const Product = require('../models/product');
const ProductCategory = require('../models/productCategory');
const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');

const createProduct = asyncHandler(async (req, res) => {
    try {
        // Lấy dữ liệu từ req.body
        const { title, price, description, brand, category, color } = req.body;
        if (!title || !price || !description || !brand || !category) {
            throw new Error('All required fields must be provided');
        }
        // Xác thực Category
        // Người dùng sẽ gửi lên tên của category (ví dụ: "Điện thoại")
        // Chúng ta cần tìm document category tương ứng trong database.
        const foundCategory = await ProductCategory.findOne({ title: category });
        // Nếu không tìm thấy category, ném lỗi -> khối catch sẽ dọn dẹp ảnh
        if (!foundCategory) {
            throw new Error(`Category '${category}' not found. Please create it first or use a valid category name.`);
        }
        // Kiểm tra xem có file ảnh được upload không
        if (!req.files || req.files.length === 0) {
            throw new Error('Product images are required');
        }
        // Xử lý mảng req.files để lấy thông tin ảnh
        const imagesData = req.files.map((file) => ({
            url: file.path,
            public_id: file.filename,
        }));
        const newProductData = {
            title,
            price,
            description,
            brand,
            color,
            slug: slugify(title, { lower: true }),
            images: imagesData,
            // [NEW] Gán _id của category đã tìm thấy vào sản phẩm
            category: foundCategory._id,
        };

        const newProduct = new Product(newProductData);
        const createdProduct = await newProduct.save();

        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            createdProduct,
        });

    } catch (error) {
        // Khối catch để dọn dẹp ảnh vẫn hoạt động hoàn hảo
        if (req.files && req.files.length > 0) {
            console.log("An application error occurred. Cleaning up uploaded files...");
            const publicIds = req.files.map((file) => file.filename);
            try {
                await cloudinary.api.delete_resources(publicIds);
                console.log("Cleanup successful.");
            } catch (cleanupError) {
                console.error("CRITICAL: Failed to clean up uploaded files.", cleanupError);
            }
        }
        
        if (error.message.includes('required') || error.message.includes('not found')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        
        throw error;
    }
});
const getProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    console.log(`--- Searching for Product ID: "${pid}" ---`);
    const product = await Product.findById(pid).populate('category' , 'title _id');

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found',
        });
    }
    return res.status(200).json({
        success: true,
        productData: product,
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
    let queryCommand = Product.find(finalQuery).populate('category', 'title _id');
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
    const { pid } = req.params;
    try {
        if (req.body.category) {
            const foundCategory = await ProductCategory.findOne({ title: req.body.category });
            if (!foundCategory) throw new Error(`Product Category '${req.body.category}' not found.`);
            req.body.category = foundCategory._id;
        }
        if (req.body.title) {
            req.body.slug = slugify(req.body.title, { lower: true });
        }

        const product = await Product.findById(pid);
        if (!product) {
            if (req.files) {
                const publicIds = req.files.map(file => file.filename);
                await cloudinary.api.delete_resources(publicIds);
            }
            return res.status(404).json({ message: 'Product not found' });
        }

        if (req.files && req.files.length > 0) {
            if (product.images && product.images.length > 0) {
                const oldImagePublicIds = product.images.map(img => img.public_id);
                await cloudinary.api.delete_resources(oldImagePublicIds);
            }
            req.body.images = req.files.map(file => ({
                url: file.path,
                public_id: file.filename
            }));
        }

        Object.assign(product, req.body);
        const updatedProduct = await product.save();
        await updatedProduct.populate('category', 'title _id');

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            updatedProduct,
        });
    } catch (error) {
        if (req.files && req.files.length > 0) {
            console.log("An error occurred during product update. Cleaning up uploaded files...");
            const publicIds = req.files.map((file) => file.filename);
            await cloudinary.api.delete_resources(publicIds);
            console.log("Cleanup successful.");
        }
        if (error.message.includes('not found')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        throw error;
    }
});
const ratings = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, comment, productId, postedBy } = req.body;
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
    const { pid } = req.params;
    if (!req.files || req.files.length === 0) {
        throw new Error('No files uploaded');
    }
    const product = await Product.findById(pid);
    if (!product) {
        throw new Error('Product not found');
    }
    const newImages = req.files.map(file => ({
        url: file.path,
        public_id: file.filename
    }));
    // 5. Thêm các ảnh mới vào mảng images của sản phẩm
    //    Sử dụng $push và $each để thêm nhiều ảnh cùng lúc
    const updatedProduct = await Product.findByIdAndUpdate(
        pid,
        { $push: { images: { $each: newImages } } },
        { new: true } // Trả về document đã được cập nhật
    );
    return res.status(200).json({
        success: true,
        message: 'Images uploaded and updated successfully',
        data: updatedProduct
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