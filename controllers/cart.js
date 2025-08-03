const asyncHandler = require('express-async-handler');
const Cart = require('../models/cart');
const Product = require('../models/product');

const cartController = {
    /**
     * @description Lấy giỏ hàng của người dùng hiện tại
     * @route GET /api/cart
     * @access Private
     */
    getCart: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'products.productId',
                select: 'title price imageUrl countInStock'
            });

        if (!cart) {
            return res.status(200).json({
                message: 'Giỏ hàng trống.',
                cart: {
                    userId: userId,
                    products: [],
                },
            });
        }
        
        res.status(200).json({
            message: 'Lấy thông tin giỏ hàng thành công!',
            cart,
        });
    }),

    /**
     * @description Thêm sản phẩm vào giỏ hàng hoặc cập nhật số lượng
     * @route POST /api/cart
     * @access Private
     */
    addToCart: asyncHandler(async (req, res) => {
        const { productId, quantity } = req.body;
        const userId = req.user.id;
        if (!productId || !quantity || quantity <= 0) {
            res.status(400); // Set status code trước khi throw
            throw new Error('Vui lòng cung cấp productId và quantity hợp lệ.');
        } 
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404);
            throw new Error('Sản phẩm không tồn tại.');
        }
        if (product.countInStock < quantity) {
            res.status(400);
            throw new Error('Số lượng sản phẩm trong kho không đủ.');
        }
        let cart = await Cart.findOne({ userId });
        if (cart) {
            const itemIndex = cart.products.findIndex(p => p.productId.toString() === productId);
            if (itemIndex > -1) {
                cart.products[itemIndex].quantity += quantity;
            } else {
                cart.products.push({ productId, quantity });
            }
            await cart.save();
        } else {
            cart = await Cart.create({
                userId,
                products: [{ productId, quantity }]
            });
        }
        const populatedCart = await Cart.findById(cart._id).populate({
            path: 'products.productId',
            select: 'name price imageUrl'
        });
        res.status(200).json({
            message: 'Thêm sản phẩm vào giỏ hàng thành công!',
            cart: populatedCart,
        });
    }),
};

module.exports = cartController;