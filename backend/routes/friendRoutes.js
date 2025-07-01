const express = require('express');
const router = express.Router();

const {
    sendFriendReq,
    unFriend,
    getAllFriendReq,
    manageFriendReq,
} = require('../app/controllers/friends');

const authMiddleware = require('../app/middlewares/authMiddleware');

const friendValidationRules = require('../app/middlewares/validators/friendValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/', authMiddleware, friendValidationRules.sendFriendReq, handleValidation, sendFriendReq);
router.get('/unfriend/:id', authMiddleware, unFriend);
router.patch('/', authMiddleware, friendValidationRules.manageFriendReq, handleValidation, manageFriendReq);
router.get('/requests', authMiddleware, getAllFriendReq);

module.exports = router;