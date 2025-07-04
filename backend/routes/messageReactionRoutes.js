const express = require('express');
const router = express.Router();

const {
    reactMessage,
    deleteReactions,
} = require('../app/controllers/messaging/messageReactions');

const authMiddleware = require('../app/middlewares/authMiddleware');

const msgReactionValidationRules = require('../app/middlewares/validators/msgReactionValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/:id', authMiddleware, msgReactionValidationRules.reactMessage, handleValidation, reactMessage);
router.delete('/:id', authMiddleware, msgReactionValidationRules.deleteReactions, handleValidation, deleteReactions);

module.exports = router;