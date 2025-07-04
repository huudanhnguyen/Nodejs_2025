const User = require('../models/user');
const asyncHandler = require('express-async-handler');

const register = asyncHandler(async (req, res) => {
    const {firstname, lastname, email, mobile, password} = req.body
    if (!firstname || !lastname || !email || !mobile || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required'
        });
    } 
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User already exists with this email'
        });
    }
            
    const response = await User.create(req.body)
    return res.status(200).json({
        message: 'User registered successfully',
        success: response ? true : false,
        response
    });

});

module.exports = register;