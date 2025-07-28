const express = require('express');
const router = express.Router();

const { getUsers, searchUsers } = require('../app/controllers/users');

const authMiddleware = require('../app/middlewares/authMiddleware');

const userValidationRules = require('../app/middlewares/validators/userValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.get('/', authMiddleware, getUsers);
router.post('/search', authMiddleware, userValidationRules.searchUsers, handleValidation, searchUsers);

module.exports = router;