const express = require('express');
const router = express.Router();

const {
    createGroup,
    sendGroupMessage,
    getGroupMessages,
    getGroupMembers
} = require('../app/controllers/groups');

const authMiddleware = require('../app/middlewares/authMiddleware');

const groupValidationRules = require('../app/middlewares/validators/groupValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/', groupValidationRules.createGroup, handleValidation, authMiddleware, createGroup);
router.post('/send-message', groupValidationRules.sendGroupMessage, handleValidation, authMiddleware, sendGroupMessage);
router.get('/messages/:id', groupValidationRules.getGroupMessages, handleValidation, authMiddleware, getGroupMessages);
router.get('/:id', groupValidationRules.getGroupMembers, handleValidation, authMiddleware, getGroupMembers);

module.exports = router;