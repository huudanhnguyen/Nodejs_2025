const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');

// Lấy thông tin cấu hình email từ file .env
const { MAIL_NAME, EMAIL_APP_PASSWORD } = process.env;
console.log('>>> Check process.env in sendMail.js:', MAIL_NAME);
// Cấu hình transporter của Nodemailer để sử dụng dịch vụ Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: MAIL_NAME,          // Địa chỉ email của bạn lấy từ .env
        pass: EMAIL_APP_PASSWORD  // Mật khẩu ứng dụng cho Gmail lấy từ .env
    }
});

const sendEmail = asyncHandler(async ({ email, html, subject }) => { // Thay đổi ở đây
    const mailOptions = {
        from: `"${MAIL_NAME}" <${MAIL_NAME}>`, 
        to: email,                                // Dùng 'email' từ tham số
        subject: subject,                         // Dùng 'subject' từ tham số
        html: html                                // Dùng 'html' từ tham số
    };

    try {
        await transporter.sendMail(mailOptions);
        return true; 
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
});

module.exports = sendEmail;