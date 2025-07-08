const express = require('express');
const router = express.Router();

const {
    createGroup,
    sendGroupMessage,
    deleteGroupMessage,
    editGroupMessage,
    getGroupData,
    getGroups,
    deleteGroup,
    leaveGroup,
    joinGroup
} = require('../app/controllers/groups');

const authMiddleware = require('../app/middlewares/authMiddleware');

const groupValidationRules = require('../app/middlewares/validators/groupValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');
const upload = require('../app/helper/upload');

router.post('/', groupValidationRules.createGroup, handleValidation, authMiddleware, createGroup);
router.post('/join', authMiddleware, groupValidationRules.joinGroup, handleValidation, joinGroup);
router.get('/leave/:id', authMiddleware, groupValidationRules.leaveGroup, handleValidation, leaveGroup)
router.post('/send-message', upload.single("file"), groupValidationRules.sendGroupMessage, handleValidation, authMiddleware, sendGroupMessage);

router.get('/data/:id', groupValidationRules.getGroupData, handleValidation, authMiddleware, getGroupData);
// router.get('/:id', groupValidationRules.getGroupMembers, handleValidation, authMiddleware, getGroupMembers); // Not needed now
router.get('/', authMiddleware, getGroups);

router.delete('/:id', authMiddleware, groupValidationRules.deleteGroup, handleValidation, deleteGroup);
router.delete('/message/:id', authMiddleware, groupValidationRules.deleteGroupMessage, handleValidation, deleteGroupMessage);

router.patch('/message/:id', authMiddleware, groupValidationRules.editGroupMessage, handleValidation, editGroupMessage);

module.exports = router;