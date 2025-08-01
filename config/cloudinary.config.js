const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  allowedFormats: ['jpg', 'png'],
    params: {
        folder: 'ecommerce', // Thư mục lưu trữ trên Cloudinary
        format: async (req, file) => {
        // Tự động xác định định dạng của file
        return file.mimetype.split('/')[1];
        },
        public_id: (req, file) => {
        // Tạo public_id duy nhất cho mỗi file
        return `${Date.now()}-${file.originalname}`;
        }
    }
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;
