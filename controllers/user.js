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
            
    const newUser = await User.create(req.body)
    return res.status(200).json({
        message: 'User registered successfully',
        success: newUser ? true : false,
        newUser
    });

});
const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                mobile: user.mobile
            }
        });
    } else {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

});

module.exports = {
    register,
    login
};