const router = require('express').Router();
const ctrls = require('../controllers/blog');
const { verifyToken, isAdmin } = require('../middlewares/verifyToken');
const uploadCloud = require('../config/cloudinary.config');

router.put('/uploadImage/:id', [verifyToken, isAdmin], uploadCloud.array('images',10), ctrls.uploadImageBlog);
router.post('/', [verifyToken, isAdmin], uploadCloud.array('images',10), ctrls.createBlog);
router.get('/',[verifyToken], ctrls.getBlogs);
router.put('/like', verifyToken, ctrls.likeBlog);
router.put('/dislike', verifyToken, ctrls.dislikeBlog);
router.get('/:id',[verifyToken], ctrls.getBlogById);
router.put('/:bid', [verifyToken, isAdmin], uploadCloud.array('images',10), ctrls.updateBlog);
router.delete('/:id', [verifyToken, isAdmin], ctrls.deleteBlog);


module.exports = router;