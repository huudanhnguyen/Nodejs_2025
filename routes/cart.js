const router = require('express').Router();
const ctrls = require('../controllers/cart');
const { verifyToken,isAdmin } = require('../middlewares/verifyToken');

router.get('/', [verifyToken], ctrls.getCart);
router.post('/', [verifyToken], ctrls.addToCart);

module.exports = router;