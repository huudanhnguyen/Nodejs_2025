const router = require('express').Router();
const ctrls = require('../controllers/user');

// User registration route
router.post('/register', ctrls.register);

// User login route
router.post('/login', ctrls.login);

module.exports = router;