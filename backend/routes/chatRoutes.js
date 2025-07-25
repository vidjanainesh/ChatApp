const express = require('express');
const router = express.Router();

const {
    sendMessage,
    deleteMessage,
    editMessage,
    getMessages,
} = require('../app/controllers/chat');

const authMiddleware = require('../app/middlewares/authMiddleware');

const chatValidationRules = require('../app/middlewares/validators/chatValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');
const upload = require('../app/helper/upload');

router.post('/', authMiddleware, (req, res, next) => { req.uploadType = 'message'; next(); }, upload.single("file"), chatValidationRules.sendMessage, handleValidation, sendMessage);
router.get('/:id', authMiddleware, chatValidationRules.getMessages, handleValidation, getMessages);
router.delete('/:id', authMiddleware, chatValidationRules.deleteMessage, handleValidation, deleteMessage);
router.patch('/:id', authMiddleware, chatValidationRules.editMessage, handleValidation, editMessage);

module.exports = router;