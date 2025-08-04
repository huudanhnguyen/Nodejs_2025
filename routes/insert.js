const router = require('express').Router();
const ctrls = require('../controllers/insertData');
const { verifyToken,isAdmin } = require('../middlewares/verifyToken');

router.post('/', ctrls.insertProduct);
router.post('/category', ctrls.insertProductCategory);

module.exports = router;
