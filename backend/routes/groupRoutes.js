const express = require('express');
const router = express.Router();

const {
    createGroup,
    sendGroupMessage
} = require('../app/controllers/groups');

const authMiddleware = require('../app/middlewares/authMiddleware');

// const friendValidationRules = require('../app/middlewares/validators/friendValidationRules');
// const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/', authMiddleware, createGroup);
router.post('/send-message', authMiddleware, sendGroupMessage);
// router.get('/requests', authMiddleware, getAllFriendReq);
// router.get('/', authMiddleware, getFriends);

module.exports = router;