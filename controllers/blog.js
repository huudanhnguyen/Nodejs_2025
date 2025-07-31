const Blog = require('../models/blog');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const createBlog = asyncHandler(async (req, res) => {
    const { title, description, category, image, author } = req.body;
    if (!title || !description || !category || !author) {
        res.status(400);
        throw new Error('All fields are required');
    }
    const blog = new Blog({
        title,
        description,
        category,
        image,
        author,
        slug: slugify(title, { lower: true, strict: true }),
    });

    const createdBlog = await blog.save();
    res.status(201).json(createdBlog);
});
const getBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({});
    res.status(200).json(blogs);
});
const getBlogById = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }
    res.status(200).json(blog);
});
const updateBlog = asyncHandler(async (req, res) => {
    const { title, description,category, author } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.category = category || blog.category;
    blog.slug = slugify(title, { lower: true, strict: true });
    blog.author = author || blog.author;

    const updatedBlog = await blog.save();
    res.status(200).json(updatedBlog);
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
module.exports = {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    likeBlog,
    dislikeBlog
};