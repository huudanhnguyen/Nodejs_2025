const router = require('express').Router();
const ctrls = require('../controllers/product');
const { verifyToken,isAdmin } = require('../middlewares/verifyToken');


router.post('/',[verifyToken, isAdmin], ctrls.createProduct);
router.get('/',[verifyToken, isAdmin], ctrls.getAllProducts);
router.get('/:id',[verifyToken, isAdmin], ctrls.getProduct);
router.put('/:id',[verifyToken, isAdmin], ctrls.updateProduct);
router.delete('/:id',[verifyToken, isAdmin], ctrls.deleteProduct);

module.exports = router;