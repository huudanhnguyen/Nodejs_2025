
const Address = require('../models/address'); 
const User = require('../models/user');
const asyncHandler = require('express-async-handler');

//================================================================================
// HÀM HELPER (Tùy chọn nhưng rất hữu ích)
// Hàm này kiểm tra xem một địa chỉ có thuộc về người dùng đang thực hiện request không
//================================================================================
const checkAddressOwnership = async (addressId, userId) => {
    const address = await Address.findById(addressId);
    if (!address) {
        // Ném lỗi để asyncHandler bắt và middleware lỗi xử lý
        throw new Error('Không tìm thấy địa chỉ.'); 
    }
    if (address.userId.toString() !== userId.toString()) {
        // Ném lỗi nếu người dùng không phải chủ sở hữu
        throw new Error('Bạn không có quyền thực hiện hành động này trên địa chỉ này.');
    }
    return address;
};


//================================================================================
// CÁC HÀM CONTROLLER CHÍNH
//================================================================================

/**
 * @desc    Tạo địa chỉ mới cho người dùng đã đăng nhập
 * @route   POST /api/addresses
 * @access  Private (Yêu cầu đăng nhập)
 */
const createAddress = asyncHandler(async (req, res) => {
    // Lấy ID người dùng từ đối tượng `req.user` mà middleware xác thực đã gắn vào
    const userId = req.user._id;

    // Nếu người dùng muốn đặt địa chỉ này làm mặc định
    if (req.body.isDefault === true) {
        // Bỏ tất cả các địa chỉ khác của người dùng này khỏi trạng thái mặc định
        await Address.updateMany({ userId: userId }, { isDefault: false });
    }

    // Tạo địa chỉ mới với dữ liệu từ request body và userId đã xác thực
    const newAddress = await Address.create({
        ...req.body,
        userId: userId, // Đảm bảo địa chỉ được gắn với đúng người dùng đang đăng nhập
    });

    res.status(201).json({
        success: true,
        message: 'Tạo địa chỉ thành công!',
        address: newAddress,
    });
});

/**
 * @desc    Lấy tất cả địa chỉ của người dùng đã đăng nhập
 * @route   GET /api/addresses
 * @access  Private
 */
const getMyAddresses = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Chỉ tìm các địa chỉ có userId khớp với ID của người dùng đã đăng nhập
    const addresses = await Address.find({ userId: userId }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: addresses.length,
        addresses,
    });
});

/**
 * @desc    Lấy một địa chỉ cụ thể theo ID
 * @route   GET /api/addresses/:id
 * @access  Private
 */
const getAddressById = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const addressId = req.params.id;

    // Kiểm tra xem địa chỉ có tồn tại và có thuộc về người dùng không
    const address = await checkAddressOwnership(addressId, userId);

    res.status(200).json({
        success: true,
        address,
    });
});


/**
 * @desc    Cập nhật một địa chỉ
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const addressId = req.params.id;

    // Bước 1: Kiểm tra quyền sở hữu trước khi làm bất cứ điều gì
    await checkAddressOwnership(addressId, userId);

    // Bước 2: Xử lý logic isDefault nếu có
    if (req.body.isDefault === true) {
        await Address.updateMany({ userId: userId }, { isDefault: false });
    }

    // Bước 3: Cập nhật địa chỉ
    // Không cần kiểm tra userId trong findOneAndUpdate nữa vì đã kiểm tra ở trên
    const updatedAddress = await Address.findByIdAndUpdate(
        addressId,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Cập nhật địa chỉ thành công!',
        address: updatedAddress,
    });
});

/**
 * @desc    Xoá một địa chỉ
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const addressId = req.params.id;

    // Kiểm tra quyền sở hữu
    const deletedAddress = await checkAddressOwnership(addressId, userId);
    
    // Thực hiện xóa
    await Address.findByIdAndDelete(addressId);

    // Nếu địa chỉ bị xoá là mặc định, hãy đặt một địa chỉ khác làm mặc định
    if (deletedAddress.isDefault) {
        const nextAddress = await Address.findOne({ userId: userId });
        if (nextAddress) {
            nextAddress.isDefault = true;
            await nextAddress.save();
        }
    }

    res.status(200).json({ success: true, message: 'Xoá địa chỉ thành công!' });
});

/**
 * @desc    Đặt một địa chỉ làm mặc định
 * @route   PATCH /api/addresses/:id/default
 * @access  Private
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const addressId = req.params.id;

    // Kiểm tra quyền sở hữu
    await checkAddressOwnership(addressId, userId);

    // Dùng transaction để đảm bảo tính toàn vẹn dữ liệu
    await Address.updateMany({ userId: userId }, { isDefault: false });
    const newDefaultAddress = await Address.findByIdAndUpdate(
        addressId,
        { isDefault: true },
        { new: true }
    );
    
    res.status(200).json({
        success: true,
        message: 'Đặt địa chỉ mặc định thành công!',
        address: newDefaultAddress,
    });
});
const getAllAddresses = asyncHandler(async (req, res) => {
    const addresses = await Address.find().populate('userId', 'name email').sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: addresses.length,
        addresses,
    });
});
module.exports = {
    createAddress,
    getMyAddresses,
    getAddressById,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAllAddresses,
};