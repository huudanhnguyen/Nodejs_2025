const express = require('express');
const router = express.Router();
const ctrls = require('../controllers/coupon');
const { verifyToken, isAdmin } = require('../middlewares/verifyToken');

// Các route cần quyền Admin
router.post('/', [verifyToken, isAdmin], ctrls.createCoupon);
router.put('/:id', [verifyToken, isAdmin], ctrls.updateCoupon);
router.delete('/:id', [verifyToken, isAdmin], ctrls.deleteCoupon);
// Các route công khai (public)
router.get('/', ctrls.getAllCoupons);
router.get('/:id', ctrls.getCouponById);

module.exports = router;