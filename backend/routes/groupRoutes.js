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
    inviteToGroup,
    removeFromGroup,
    setAdmin,
    removeAdmin,
    getGroupInfo,
    editGroupInfo
} = require('../app/controllers/groups');

const authMiddleware = require('../app/middlewares/authMiddleware');

const groupValidationRules = require('../app/middlewares/validators/groupValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');
const upload = require('../app/helper/upload');

router.post('/', groupValidationRules.createGroup, handleValidation, authMiddleware, createGroup);
router.post('/invite', authMiddleware, groupValidationRules.joinGroup, handleValidation, inviteToGroup);
router.get('/leave/:id', authMiddleware, groupValidationRules.leaveGroup, handleValidation, leaveGroup);
router.post('/remove/:id', authMiddleware, groupValidationRules.removeFromGroup, handleValidation, removeFromGroup);

router.post('/admin/:id', authMiddleware, setAdmin);
router.patch('/admin/:id', authMiddleware, removeAdmin);

router.get('/info/:id', authMiddleware, getGroupInfo);
router.patch('/info/:id', authMiddleware, (req, res, next) => { req.uploadType = 'profile'; next(); }, upload.single('file'), editGroupInfo);

router.get('/:id', groupValidationRules.getGroupData, handleValidation, authMiddleware, getGroupData);
// router.get('/:id', groupValidationRules.getGroupMembers, handleValidation, authMiddleware, getGroupMembers); // Not needed now
router.get('/', authMiddleware, getGroups);

router.post('/send-message', upload.single("file"), groupValidationRules.sendGroupMessage, handleValidation, authMiddleware, sendGroupMessage);
router.delete('/message/:id', authMiddleware, groupValidationRules.deleteGroupMessage, handleValidation, deleteGroupMessage);
router.patch('/message/:id', authMiddleware, groupValidationRules.editGroupMessage, handleValidation, editGroupMessage);

router.delete('/:id', authMiddleware, groupValidationRules.deleteGroup, handleValidation, deleteGroup);

module.exports = router;