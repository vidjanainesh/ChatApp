const express = require('express');
const router = express.Router();

const authenticationRoutes = require('./authenticationRoutes');
const chatRoutes = require('./chatRoutes');
const friendRoutes = require('./friendRoutes');
const groupRoutes = require('./groupRoutes');

router.use('/authenticate', authenticationRoutes);
router.use('/chat', chatRoutes);
router.use('/friend', friendRoutes);
router.use('/group', groupRoutes);

router.get('/ping', (req, res) => res.status(200).send('PING!'));

module.exports = router;