const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// MANAGER only route
router.post('/', auth, role('MANAGER'), userController.createUser);

module.exports = router;