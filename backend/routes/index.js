const express = require('express');
const router = express.Router();

const authenticationRoutes = require('./authenticationRoutes');
const chatRoutes = require('./chatRoutes');

router.use('/authenticate', authenticationRoutes);
router.use('/chat', chatRoutes);

module.exports = router;