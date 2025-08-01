const express = require('express');
const router = express.Router();
const ctrls = require('../controllers/brand');
const { verifyToken, isAdmin } = require('../middlewares/verifyToken');

// Các route cần quyền Admin
router.post('/', [verifyToken, isAdmin], ctrls.createBrand);
router.put('/:id', [verifyToken, isAdmin], ctrls.updateBrand);
router.delete('/:id', [verifyToken, isAdmin], ctrls.deleteBrand);

// Các route công khai (public)
router.get('/', ctrls.getAllBrands);
router.get('/:id', ctrls.getBrandById);

module.exports = router;