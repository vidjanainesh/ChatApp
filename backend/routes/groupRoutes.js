const express = require('express');
const router = express.Router();

const {
    createGroup,
    sendGroupMessage,
    getGroupData,
    getUnreadGroupMessages,
    getGroups,
    deleteGroup,
    leaveGroup,
    joinGroup
} = require('../app/controllers/groups');

const authMiddleware = require('../app/middlewares/authMiddleware');

const groupValidationRules = require('../app/middlewares/validators/groupValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/', groupValidationRules.createGroup, handleValidation, authMiddleware, createGroup);
router.post('/join', authMiddleware, joinGroup);
router.get('/leave/:id', authMiddleware, leaveGroup)
router.post('/send-message', groupValidationRules.sendGroupMessage, handleValidation, authMiddleware, sendGroupMessage);

router.get('/data/:id', groupValidationRules.getGroupData, handleValidation, authMiddleware, getGroupData);
router.get('/unread', authMiddleware, getUnreadGroupMessages);
// router.get('/:id', groupValidationRules.getGroupMembers, handleValidation, authMiddleware, getGroupMembers); // Not needed now
router.get('/', authMiddleware, getGroups);

router.delete('/:id', authMiddleware, deleteGroup);

module.exports = router;