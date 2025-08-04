const Product = require('../models/product');
const data = require('../../data/data.js'); // Đảm bảo đường dẫn này đúng
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

// Hàm fn sẽ nhận vào một 'item' (sản phẩm thực sự) và 'categoryName'
const fn = asyncHandler(async (item, categoryName) => {
    // 1. LÀM SẠCH GIÁ
    const cleanedPrice = item.price ? Number(item.price.replace(/[^0-9]/g, '')) : 0;

    // 2. XỬ LÝ MÀU SẮC (COLOR)
    // Tìm đối tượng variant có label là "Color" và lấy mảng variants bên trong nó
    const colorVariant = item.variants?.find(v => v.label === 'Color');
    const colors = colorVariant ? colorVariant.variants : ['Default Color']; // Nếu không tìm thấy, dùng màu mặc định

    // 3. TẠO MÔ TẢ (DESCRIPTION)
    const description = [];
    if (item.description && Array.isArray(item.description)) {
        description.push(...item.description);
    }
    // Chuyển đối tượng informations thành các chuỗi "key: value" có nghĩa hơn
    if (item.informations) {
        description.push(...Object.entries(item.informations).map(([key, value]) => `${key}: ${value.trim()}`));
    }
    // Thêm các thông số kỹ thuật khác vào description nếu muốn
    if (item.thumb) description.push(`Thumbnail: ${item.thumb}`);
    let finalCategory;
    if (item.category && Array.isArray(item.category) && item.category.length > 0) {
        // Lấy phần tử cuối cùng trong mảng làm category chính
        finalCategory = item.category[item.category.length - 1];
    } else {
        // Nếu item không có category, dùng categoryName từ đối tượng cha làm dự phòng
        finalCategory = categoryName || 'Uncategorized';
    }

    // 4. SỬA LỖI VALIDATION VÀ TẠO SẢN PHẨM
    await Product.create({
        title: item.name,
        slug: slugify(item.name) + '-' + Math.round(Math.random() * 10000),
        description: description,
        price: cleanedPrice,
        brand: item.brand,
        category: finalCategory,
        quantity: Math.round(Math.random() * 50 + 50),
        sold: Math.round(Math.random() * 40),
        images: item.images,
        color: colors[0], // Lấy màu đầu tiên làm màu chính, hoặc bạn có thể lưu cả mảng nếu schema cho phép
    });
});

const insertProduct = asyncHandler(async (req, res) => {
    const promises = [];

    // LOGIC ĐÚNG: Dùng vòng lặp lồng nhau
    for (const category of data) {
        // Nếu categoryName rỗng, gán một giá trị mặc định
        const currentCategoryName = category.categoryName || 'Uncategorized';
        for (const item of category.items) {
            // Gọi hàm fn với đối tượng sản phẩm 'item' và tên category đã được chuẩn hóa
            promises.push(fn(item, currentCategoryName));
        }
    }

    await Promise.all(promises);
    return res.json('Done inserting all products!');
});

module.exports = {
    insertProduct
};