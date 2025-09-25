const express = require('express');
const router = express.Router();

const { sendChatbotMessage, getChatbotMessages } = require('../app/controllers/chatbot');

const authMiddleware = require('../app/middlewares/authMiddleware');
const upload = require('../app/helper/upload');

// const friendValidationRules = require('../app/middlewares/validators/friendValidationRules');
// const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/', authMiddleware, upload.none(), sendChatbotMessage);
router.get('/', authMiddleware, upload.none(), getChatbotMessages);

module.exports = router;