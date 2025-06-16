const express = require('express');
const router = express.Router();

const {
    sendMessage,
    getMessages,
    getUsers,
    getUnreadMessages
} = require('../controllers/chat');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/send', authMiddleware, sendMessage);
router.get('/get/:id', authMiddleware, getMessages);
router.get('/unread', authMiddleware, getUnreadMessages);
router.get('/get', authMiddleware, getUsers);

module.exports = router;