const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',                        
      required: true,
    },
    recipientName: {
      type: String,
      required: [true, 'Tên người nhận là bắt buộc'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
    //   match: [/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ'], // Regex cho SĐT Việt Nam
    },
    street: {
      type: String,
      required: [true, 'Địa chỉ đường là bắt buộc'],
      trim: true,
    },
    ward: {
      type: String,
      required: [true, 'Phường/Xã là bắt buộc'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'Quận/Huyện là bắt buộc'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Tỉnh/Thành phố là bắt buộc'],
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
// Tạo một trường ảo (virtual field) để lấy địa chỉ đầy đủ
// Trường này không được lưu trong DB mà được tính toán khi truy vấn
addressSchema.virtual('fullAddress').get(function() {
  return `${this.street}, ${this.ward}, ${this.district}, ${this.city}`;
});

module.exports = mongoose.model('Address', addressSchema);