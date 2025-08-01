const router = require('express').Router();
const ctrls = require('../controllers/product');
const { verifyToken,isAdmin } = require('../middlewares/verifyToken');
const uploadCloud = require('../config/cloudinary.config');

router.put('/uploadImage/:id', [verifyToken, isAdmin], uploadCloud.single('images'), ctrls.uploadImageProduct);
router.post('/',[verifyToken, isAdmin], ctrls.createProduct);
router.get('/',[verifyToken, isAdmin], ctrls.getAllProducts);
router.get('/:id',[verifyToken, isAdmin], ctrls.getProduct);
router.put('/:id',[verifyToken, isAdmin], ctrls.updateProduct);
router.delete('/:id',[verifyToken, isAdmin], ctrls.deleteProduct);
router.post('/ratings', [verifyToken], ctrls.ratings);


module.exports = router;