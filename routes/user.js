const router = require('express').Router();
const ctrls = require('../controllers/user');
const { verifyToken,isAdmin } = require('../middlewares/verifyToken');

// User registration route
router.post('/register', ctrls.register);
// User login route
router.post('/login', ctrls.login);
router.get('/profile',verifyToken, ctrls.getUserProfile);
router.post('/refreshtoken', ctrls.refreshAccessToken);
router.get('/logout', ctrls.logout);
router.get('/forgot-password', ctrls.forgotPassword);
router.put('/reset-password/:token', ctrls.resetPassword);
router.use(verifyToken); // Apply verifyToken middleware to all routes below this point
// Get all users route (admin only)
router.get('/', [verifyToken, isAdmin], ctrls.getUsers);
router.delete('/:id', [isAdmin], ctrls.deleteUser);
router.put('/:id', ctrls.updateUser);
router.put('/:id', [isAdmin], ctrls.updateUserbyAdmin);

module.exports = router;