const express = require('express');
const router = express.Router();

const {
    sendFriendReq,
    getAllFriendReq,
    manageFriendReq,
    getFriends
} = require('../app/controllers/friends');

const authMiddleware = require('../app/middlewares/authMiddleware');

const friendValidationRules = require('../app/middlewares/validators/friendValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/send', authMiddleware, friendValidationRules.sendFriendReq, handleValidation, sendFriendReq);
router.post('/update', authMiddleware, friendValidationRules.manageFriendReq, handleValidation, manageFriendReq);
router.get('/requests', authMiddleware, getAllFriendReq);
router.get('/', authMiddleware, getFriends);

module.exports = router;