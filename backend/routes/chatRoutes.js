const express = require('express');
const router = express.Router();

const {
    sendMessage,
    getMessages,
    getUsers,
} = require('../app/controllers/chat');

const authMiddleware = require('../app/middlewares/authMiddleware');

const chatValidationRules = require('../app/middlewares/validators/chatValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/send', authMiddleware, chatValidationRules.sendMessage, handleValidation, sendMessage);
router.get('/get/:id', authMiddleware, chatValidationRules.getMessages, handleValidation, getMessages);
router.get('/get', authMiddleware, getUsers);

module.exports = router;