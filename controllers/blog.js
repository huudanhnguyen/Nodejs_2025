const Blog = require('../models/blog');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const cloudinary = require('cloudinary').v2;
const BlogCategory = require('../models/blogCategory'); // Import BlogCategory model
const createBlog = asyncHandler(async (req, res) => {
    try {
        const { title, description, category, author } = req.body;
        if (!title || !description || !category || !author) {
            throw new Error('All required fields must be provided');
        }
        const foundCategory = await BlogCategory.findOne({ title: category });
        if (!foundCategory) {
            throw new Error(`Blog Category '${category}' not found.`);
        }
        if (!req.files || req.files.length === 0) {
            throw new Error('Blog images are required');
        }
        const imagesData = req.files.map((file) => ({
            url: file.path,
            public_id: file.filename,
        }));
        const newBlogData = {
            title,
            description,
            author, // Giả sử author vẫn là một ObjectId
            slug: slugify(title, { lower: true }),
            images: imagesData,
            category: foundCategory._id, // [NEW] Gán _id của category đã tìm thấy
        };
        const newBlog = new Blog(newBlogData);
         await newBlog.save();

        // [NEW] Populate dữ liệu sau khi đã lưu
        // Dùng .populate() trên đối tượng newBlog để làm đầy các trường tham chiếu
        await newBlog.populate('category', 'title _id'); // Chỉ lấy title và _id của category
        await newBlog.populate('author', 'firstname lastname');
        const createdBlog = newBlog.toObject(); // Chuyển đổi sang object thuần túy
        return res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            createdBlog,
        });
    } catch (error) {
        // Khối catch để dọn dẹp ảnh vẫn hoạt động hoàn hảo
        if (req.files && req.files.length > 0) {
            console.log("An application error occurred. Cleaning up uploaded files...");
            const publicIds = req.files.map((file) => file.filename);
            await cloudinary.api.delete_resources(publicIds);
        }
        
        if (error.message.includes('required') || error.message.includes('not found')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        
        throw error;
    }
});
const updateBlog = asyncHandler(async (req, res) => {
    const { bid } = req.params;
    try {
        if (req.body.category) {
            // Tìm category mới bằng tên
            const foundCategory = await BlogCategory.findOne({ title: req.body.category });
            if (!foundCategory) {
                throw new Error(`Blog Category '${req.body.category}' not found.`);
            }
            req.body.category = foundCategory._id;
        }
        const blog = await Blog.findById(bid);
        if (!blog) {
            if (req.files) {
                const publicIds = req.files.map(file => file.filename);
                await cloudinary.api.delete_resources(publicIds);
            }
            return res.status(404).json({ message: 'Blog not found' });
        }
        if (req.body.title) {
            req.body.slug = slugify(req.body.title, { lower: true });
        }
        if (req.files && req.files.length > 0) {
            if (blog.images && blog.images.length > 0) {
                const oldImagePublicIds = blog.images.map(img => img.public_id);
                await cloudinary.api.delete_resources(oldImagePublicIds);
            }
            req.body.images = req.files.map(file => ({
                url: file.path,
                public_id: file.filename
            }));
        }
        Object.assign(blog, req.body);
        const updatedBlog = await blog.save();
        await updatedBlog.populate('category', 'name');
        await updatedBlog.populate('author', 'firstname lastname');
        return res.status(200).json({
            success: true,
            message: 'Blog updated successfully',
            updatedBlog,
        });

    } catch (error) {
        if (req.files && req.files.length > 0) {
            console.log("An error occurred during blog update. Cleaning up uploaded files...");
            const publicIds = req.files.map((file) => file.filename);
            await cloudinary.api.delete_resources(publicIds);
        }

        if (error.message.includes('not found')) {
            return res.status(400).json({ success: false, message: error.message });
        }

        throw error;
    }
});
const deleteBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }
    res.status(200).json({ message: 'Blog removed successfully', deletedBlog: blog });
});
// likeBlog and dislikeBlog
const likeBlog = asyncHandler(async (req, res) => {
    const { bid } = req.body;
    const { _id } = req.user;
    if (!bid) {
        res.status(400);
        throw new Error('Blog ID is required');
    }
    const blog = await Blog.findById(bid);
    if (!blog) {
        res.status(404);
        throw new Error(`Blog with ID ${bid} not found`);
    }
    const alreadyDisliked = blog.dislikes.find(userId => userId.toString() === _id.toString());
    if (alreadyDisliked) {
        // Nếu user đang dislike, thì xóa dislike và thêm like
        const response = await Blog.findByIdAndUpdate(bid, {
            $pull: { dislikes: _id }, // Xóa user khỏi mảng dislikes
            $push: { likes: _id }     // Thêm user vào mảng likes
        }, { new: true });
        return res.json({ message: 'Dislike removed and blog liked', blog: response });
    }
    const isLiked = blog.likes.find(userId => userId.toString() === _id.toString());
    if (isLiked) {
        const response = await Blog.findByIdAndUpdate(bid, {
            $pull: { likes: _id } // Xóa user khỏi mảng likes
        }, { new: true });
        return res.json({ message: 'Like removed', blog: response });
    } else {
        const response = await Blog.findByIdAndUpdate(bid, {
            $push: { likes: _id } // Thêm user vào mảng likes
        }, { new: true });
        const blogObject = response.toObject();         // 1. Chuyển Mongoose document sang object thuần túy
        const loginUserId = req.user._id.toString();
        // 3. Tính toán và thêm các trường ảo
        blogObject.isLiked = response.likes.some(userId => userId.toString() === loginUserId);
        blogObject.isDisliked = response.dislikes.some(userId => userId.toString() === loginUserId);
        return res.json(blogObject);
    }
});
// ... các hàm khác trong file controllers/blog.js

const dislikeBlog = asyncHandler(async (req, res) => {
    const { bid } = req.body;
    const { _id } = req.user;

    if (!bid) {
        res.status(400);
        throw new Error('Blog ID is required');
    }

    const blog = await Blog.findById(bid);
    if (!blog) {
        res.status(404);
        throw new Error(`Blog with ID ${bid} not found`);
    }

    // Kiểm tra xem user đã "like" bài viết này chưa
    const isLiked = blog.likes.find(userId => userId.toString() === _id.toString());
    if (isLiked) {
        // Nếu đã like, thì xóa like và thêm dislike (chuyển trạng thái)
        const response = await Blog.findByIdAndUpdate(bid, {
            $pull: { likes: _id },      // Xóa user khỏi mảng likes
            $push: { dislikes: _id }  // Thêm user vào mảng dislikes
        }, { new: true });
        return res.json({ message: 'Like removed and blog disliked', blog: response });
    }
    
    // Nếu chưa like, thì kiểm tra xem đã dislike chưa
    const alreadyDisliked = blog.dislikes.find(userId => userId.toString() === _id.toString());
    if (alreadyDisliked) {
        // Nếu đã dislike rồi, thì bỏ dislike
        const response = await Blog.findByIdAndUpdate(bid, {
            $pull: { dislikes: _id } // Xóa user khỏi mảng dislikes
        }, { new: true });
        return res.json({ message: 'Dislike removed', blog: response });
    } else {
        // Nếu chưa có hành động gì, thì thêm dislike
        const response = await Blog.findByIdAndUpdate(bid, {
            $push: { dislikes: _id } // Thêm user vào mảng dislikes
        }, { new: true });
        return res.json({ message: 'Blog disliked', blog: response });
    }
});
const excludeFields = '-__v -password -refreshToken -role -createdAt -updatedAt'; // Chỉ lấy các trường likes và dislikes
// File: controllers/blog.js

const getBlogById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const excludeFields = '-__v -password -refreshToken -role -createdAt -updatedAt -email -mobile -role -cart -address -wishlist -isBlocked'; // Chỉ lấy các trường likes và dislikes
    const blog = await Blog.findByIdAndUpdate(id,{ $inc: { numberViews: 1 } }, { new: true})// Tăng số lượt xem mỗi khi truy cập
        .populate('likes', 'lastName firstName email') // Chỉ lấy các trường cần thiết từ likes
        .populate('dislikes', 'lastName firstName email') // Chỉ lấy các trường cần thiết từ dislikes
        .populate('author', 'firstName lastName'); // Bạn có thể thêm populate author nếu cần
    if (!blog) {
        res.status(404);
        throw new Error("Blog not found");
    }
    // Chuyển Mongoose document thành object thuần túy để có thể thêm thuộc tính mới
    const blogObject = blog.toObject();
    // KIỂM TRA XEM NGƯỜI DÙNG CÓ ĐĂNG NHẬP KHÔNG
    const loginUserId = req.user?._id?.toString(); // Dùng optional chaining (?.) để tránh lỗi

    if (loginUserId) {
        // Nếu người dùng đã đăng nhập, tính toán isLiked và isDisliked
        blogObject.isLiked = blog.likes.some(user => user._id.toString() === loginUserId);
        blogObject.isDisliked = blog.dislikes.some(user => user._id.toString() === loginUserId);
    } else {
        // Nếu không, mặc định là false
        blogObject.isLiked = false;
        blogObject.isDisliked = false;
    }
    res.status(200).json(blogObject);
});
const getBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({})
        .populate('likes', 'lastName firstName email')
        .populate('dislikes', 'lastName firstName email')
        .populate('author', 'firstName lastName')
        .populate('category', 'title _id') // Chỉ lấy title và _id của category
    res.status(200).json(blogs);
});
const uploadImageBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
        throw new Error('No files uploaded');
    }
    const blog = await Blog.findById(id);
    if (!blog) {
        throw new Error('Blog not found');
    }
    const newImages = req.files.map(file => ({
        url: file.path,
        public_id: file.filename
    }));
    // 5. Thêm các ảnh mới vào mảng images của sản phẩm
    //    Sử dụng $push và $each để thêm nhiều ảnh cùng lúc
    const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        { $push: { images: { $each: newImages } } },
        { new: true } // Trả về document đã được cập nhật
    );
    return res.status(200).json({
        success: true,
        message: 'Images uploaded and updated successfully',
        data: updatedBlog
    });
});
module.exports = {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    likeBlog,
    dislikeBlog,
    uploadImageBlog
};