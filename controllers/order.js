const asyncHandler = require('express-async-handler');
const Order = require('../models/order');
const Product = require('../models/product');

const orderController = {
    /**
     * @description Tạo một đơn hàng mới, cập nhật tồn kho
     * @route POST /api/orders
     * @access Private
     */
    createOrder: asyncHandler(async (req, res) => {
        // userId nên được lấy từ middleware xác thực
        // const userId = req.user.id;
        const { userId, orderItems, shippingAddress } = req.body; // orderItems: [{ productId, quantity }]

        if (!orderItems || orderItems.length === 0) {
            res.status(400);
            throw new Error('Không có sản phẩm nào trong giỏ hàng.');
        }
        
        // 1. Lấy thông tin đầy đủ của các sản phẩm từ DB
        const productIds = orderItems.map(item => item.productId);
        const productsFromDB = await Product.find({ _id: { $in: productIds } });

        if (productsFromDB.length !== productIds.length) {
            res.status(404);
            throw new Error('Một hoặc nhiều sản phẩm không được tìm thấy.');
        }

        let totalAmount = 0;
        // 2. Tạo mảng products cho order và tính tổng tiền
        const productsForOrder = orderItems.map(item => {
            const product = productsFromDB.find(p => p._id.toString() === item.productId);

            // Kiểm tra tồn kho
            if (product.countInStock < item.quantity) {
                res.status(400);
                throw new Error(`Sản phẩm "${product.name}" không đủ hàng.`);
            }

            totalAmount += product.price * item.quantity;

            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price, // Lấy giá từ DB, không phải từ client
                name: product.name, // Lưu tên sản phẩm để hiển thị
                imageUrl: product.imageUrl // Lưu URL hình ảnh để hiển thị
                
            };
        });

        // 3. Tạo đơn hàng mới
        const newOrder = new Order({
            userId,
            products: productsForOrder,
            totalAmount,
            shippingAddress,
            status: 'pending', // Trạng thái mặc định
        });

        const savedOrder = await newOrder.save();
        
        // 4. Cập nhật số lượng tồn kho cho từng sản phẩm
        for (const item of savedOrder.products) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { countInStock: -item.quantity } // Dùng $inc để trừ đi số lượng
            });
        }

        res.status(201).json({
            message: 'Tạo đơn hàng thành công!',
            order: savedOrder,
        });
    }),

    /**
     * @description Lấy tất cả đơn hàng (sử dụng populate)
     * @route GET /api/orders
     * @access Private
     */
    getAllOrders: asyncHandler(async (req, res) => {
        const { userId } = req.query;
        let filter = {};
        if (userId) filter.userId = userId;

        const orders = await Order.find(filter)
            .populate('userId', 'name email') // Populate thông tin người dùng
            // THÊM DÒNG NÀY: Populate thông tin sản phẩm trong đơn hàng
            .populate('products.productId', 'title price imageUrl') 
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách đơn hàng thành công!',
            count: orders.length,
            orders,
        });
    }),

    /**
     * @description Lấy thông tin chi tiết một đơn hàng (sử dụng populate)
     * @route GET /api/orders/:id
     * @access Private
     */
    getOrderById: asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email') // Populate thông tin người dùng
            .populate('products.productId', 'title price imageUrl'); // Populate thông tin sản phẩm

        if (!order) {
            res.status(404);
            throw new Error('Không tìm thấy đơn hàng.');
        }

        res.status(200).json({
            message: 'Lấy thông tin đơn hàng thành công!',
            order,
        });
    }),
    /**
     * @description Cập nhật trạng thái đơn hàng
     * @route PUT /api/orders/:id/status
     * @access Private (Admin)
     */
    updateOrderStatus: asyncHandler(async (req, res) => {
        const { status } = req.body;
        if (!status) {
            res.status(400);
            throw new Error('Vui lòng cung cấp trạng thái đơn hàng.');
        }

        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!order) {
            res.status(404);
            throw new Error('Không tìm thấy đơn hàng để cập nhật.');
        }

        res.status(200).json({
            message: 'Cập nhật trạng thái đơn hàng thành công!',
            order,
        });
    }),
    /**
     * @description Xóa một đơn hàng
     * @route DELETE /api/orders/:id
     * @access Private (Admin)
     */
    deleteOrder: asyncHandler(async (req, res) => {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Không tìm thấy đơn hàng để xóa.');
        }

        res.status(200).json({
            message: 'Xóa đơn hàng thành công!',
            orderId: req.params.id,
        });
    }),
    /**
     * @description Lấy đơn hàng của người dùng hiện tại
     * @route GET /api/orders/my-orders
     * @access Private
     */
    getMyOrders: asyncHandler(async (req, res) => {
        const userId = req.user.id; // Lấy userId từ middleware xác thực

        const orders = await Order.find({ userId })
            .populate('products.productId', 'title price imageUrl') // Populate thông tin sản phẩm
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách đơn hàng của bạn thành công!',
            count: orders.length,
            orders,
        });
    }),
    getStatusOrder: asyncHandler(async (req, res) => {
        const { status } = req.query;
        if (!status) {
            res.status(400);
            throw new Error('Vui lòng cung cấp trạng thái đơn hàng.');
        }
        const orders = await Order.find({ status })
            .populate('userId', 'name email') // Populate thông tin người dùng
            .populate('products.productId', 'title price imageUrl') // Populate thông tin sản phẩm
            .sort({ createdAt: -1 });
        if (orders.length === 0) {
            res.status(404).json({
                message: 'Không tìm thấy đơn hàng với trạng thái này.',
            });
            return;
        }
        res.status(200).json({
            message: `Lấy danh sách đơn hàng với trạng thái "${status}" thành công!`,
            count: orders.length,
            orders,
        });
    }),
};

module.exports = orderController;