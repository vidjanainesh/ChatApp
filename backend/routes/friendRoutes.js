const express = require('express');
const router = express.Router();

const {
    sendFriendReq,
    getAllFriendReq,
    manageFriendReq,
    getFriends
} = require('../controllers/friends');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/send', authMiddleware, sendFriendReq);
router.post('/update', authMiddleware, manageFriendReq);
router.get('/requests', authMiddleware, getAllFriendReq);
router.get('/', authMiddleware, getFriends);

module.exports = router;