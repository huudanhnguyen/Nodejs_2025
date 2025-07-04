const router = require('express').Router();
const register = require('../controllers/user');
// Import other controllers as needed   
const asyncHandler = require('express-async-handler');
// User registration route
router.post('/register', asyncHandler(register));
// Example route for user logi

module.exports = router;