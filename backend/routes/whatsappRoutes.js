const express = require('express');
const router = express.Router();

const { whatsappNotify } = require('../app/controllers/whatsapp');

const authMiddleware = require('../app/middlewares/authMiddleware');
const upload = require('../app/helper/upload');

// const friendValidationRules = require('../app/middlewares/validators/friendValidationRules');
// const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/notify', authMiddleware, upload.none(), whatsappNotify);

module.exports = router;