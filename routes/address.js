const router = require('express').Router();
const ctrls = require('../controllers/address');
const { verifyToken } = require('../middlewares/verifyToken');
const { isAdmin } = require('../middlewares/verifyToken');

router.post('/', verifyToken, ctrls.createAddress);
router.get('/users/:userId', verifyToken, ctrls.getMyAddresses);
router.get('/', verifyToken,isAdmin, ctrls.getAllAddresses);
router.put('/:id', verifyToken, ctrls.updateAddress);
router.delete('/:id', verifyToken, ctrls.deleteAddress);
router.get('/:id', verifyToken, ctrls.getAddressById);
router.patch('/:id/default', verifyToken, ctrls.setDefaultAddress);

module.exports = router;