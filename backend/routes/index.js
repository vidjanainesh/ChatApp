const express = require('express');
const router = express.Router();

const authenticationRoutes = require('./authenticationRoutes');
const chatRoutes = require('./chatRoutes');
const friendRoutes = require('./friendRoutes');

router.use('/authenticate', authenticationRoutes);
router.use('/chat', chatRoutes);
router.use('/friend', friendRoutes);

module.exports = router;