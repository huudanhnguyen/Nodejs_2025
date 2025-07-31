const router = require('express').Router();
const ctrls = require('../controllers/blog');
const { verifyToken, isAdmin } = require('../middlewares/verifyToken');

router.post('/', [verifyToken, isAdmin], ctrls.createBlog);
router.get('/', ctrls.getBlogs);
router.put('/like', verifyToken, ctrls.likeBlog);
router.put('/dislike', verifyToken, ctrls.dislikeBlog);
router.get('/:id', ctrls.getBlogById);
router.put('/:id', [verifyToken, isAdmin], ctrls.updateBlog);
router.delete('/:id', [verifyToken, isAdmin], ctrls.deleteBlog);


module.exports = router;