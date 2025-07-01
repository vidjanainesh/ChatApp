const express = require('express');
const router = express.Router();

const {
    reactMessage,
    deleteReactions,
} = require('../app/controllers/messaging/messageReactions');

const authMiddleware = require('../app/middlewares/authMiddleware');

// const friendValidationRules = require('../app/middlewares/validators/friendValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/:id', authMiddleware, reactMessage);
router.delete('/:id', authMiddleware, deleteReactions);
// router.get('/unfriend/:id', authMiddleware, unFriend);
// router.patch('/', authMiddleware, friendValidationRules.manageFriendReq, handleValidation, manageFriendReq);
// router.get('/requests', authMiddleware, getAllFriendReq);

module.exports = router;