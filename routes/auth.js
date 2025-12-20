var express = require('express');
var router = express.Router();
const { register, login, refresh } = require('../controllers/authController');

/* POST register new user. */
router.post('/register', register);

/* POST login user. */
router.post('/login', login);

/* POST refresh access token. */
router.post('/refresh', refresh);

module.exports = router;
