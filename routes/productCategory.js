const router = require('express').Router();
const ctrls = require('../controllers/productCategory');
const { verifyToken,isAdmin } = require('../middlewares/verifyToken');

router.post('/',[verifyToken, isAdmin], ctrls.createProductCategory);
router.get('/:id', ctrls.getProductCategories);
router.get('/', ctrls.getProductCategories);
router.put('/:id',[verifyToken, isAdmin], ctrls.updateProductCategory);
router.delete('/:id',[verifyToken, isAdmin], ctrls.deleteProductCategory);

module.exports = router;
