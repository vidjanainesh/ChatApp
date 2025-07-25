const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const chatRoutes = require('./chatRoutes');
const friendRoutes = require('./friendRoutes');
const userRoutes = require('./userRoutes');
const groupRoutes = require('./groupRoutes');
const messageReactionRoutes = require('./msgReactionRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const getDashboardData = require('../app/controllers/dashboard');
const authMiddleware = require('../app/middlewares/authMiddleware');

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/friend', friendRoutes);
router.use('/user', userRoutes);
router.use('/group', groupRoutes);
router.use('/react', messageReactionRoutes);
router.use('/dashboard', dashboardRoutes)

router.get('/ping', (req, res) => res.status(200).send('PING!'));

module.exports = router;