const router = require('express').Router();
const ctrls = require('../controllers/user');
const { verifyToken } = require('../middlewares/verifyToken');

// User registration route
router.post('/register', ctrls.register);

// User login route
router.post('/login', ctrls.login);
router.get('/profile',verifyToken, ctrls.getUserProfile);
router.post('/refreshtoken', ctrls.refreshAccessToken);
router.get('/logout', ctrls.logout);
router.get('/forgot-password', ctrls.forgotPassword);
router.put('/reset-password/:token', ctrls.resetPassword);

module.exports = router;