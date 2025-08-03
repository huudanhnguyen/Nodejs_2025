const router = require('express').Router();
const ctrls = require('../controllers/order');
const { verifyToken, isAdmin } = require('../middlewares/verifyToken');

router.get('/my-orders', [verifyToken], ctrls.getMyOrders);
router.post('/', [verifyToken], ctrls.createOrder);
router.get('/', [verifyToken], isAdmin, ctrls.getAllOrders);
router.get('/:id', [verifyToken], ctrls.getOrderById);
router.put('/:id', [verifyToken, isAdmin], ctrls.updateOrderStatus);
router.delete('/:id', [verifyToken, isAdmin], ctrls.deleteOrder);


module.exports = router;
