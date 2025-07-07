const express = require('express');
const router = express.Router();

const { getUsers, searchUsers } = require('../app/controllers/users');
const authMiddleware = require('../app/middlewares/authMiddleware');

router.get('/', authMiddleware, getUsers);
router.post('/search', authMiddleware, searchUsers);

module.exports = router;