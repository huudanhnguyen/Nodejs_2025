const router = require('express').Router();
const ctrls = require('../controllers/product');
const { verifyToken,isAdmin } = require('../middlewares/verifyToken');
const uploadCloud = require('../config/cloudinary.config');

router.put('/uploadImage/:pid', [verifyToken, isAdmin], uploadCloud.array('images',10), ctrls.uploadImageProduct);
router.post('/',[verifyToken, isAdmin], uploadCloud.array('images',10), ctrls.createProduct);
router.get('/',[verifyToken, isAdmin], ctrls.getAllProducts);
router.get('/:pid',[verifyToken, isAdmin], ctrls.getProduct);
router.put('/:pid',[verifyToken, isAdmin], uploadCloud.array('images',10), ctrls.updateProduct);
router.delete('/:id',[verifyToken, isAdmin], ctrls.deleteProduct);
router.post('/ratings', [verifyToken], ctrls.ratings);


module.exports = router;