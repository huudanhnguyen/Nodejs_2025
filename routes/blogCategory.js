const router = require('express').Router();
const ctrls = require('../controllers/blogCategory');
const { verifyToken,isAdmin } = require('../middlewares/verifyToken');

router.post('/',[verifyToken, isAdmin], ctrls.createBlogCategory);
router.get('/:id', ctrls.createBlogCategory);
router.get('/', ctrls.createBlogCategory);
router.put('/:id',[verifyToken, isAdmin], ctrls.createBlogCategory);
router.delete('/:id',[verifyToken, isAdmin], ctrls.createBlogCategory);

module.exports = router;
