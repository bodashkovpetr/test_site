// routes/users.js
const router = require('express').Router();
const auth = require('../middleware/auth');
const usersController = require('../controllers/usersController');

router.get('/me', auth, usersController.getMe);
router.put('/me', auth, usersController.updateMe);

// ?????? ?????????????: ???????? ALLOW_USERS_LIST=true ? .env ??? dev
router.get('/', auth, auth.adminOnly, usersController.listUsers);

module.exports = router;