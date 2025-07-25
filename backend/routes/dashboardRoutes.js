const express = require('express');
const router = express.Router();

const getDashboardData = require('../app/controllers/dashboard');
const { viewProfile, editProfile } = require('../app/controllers/dashboard/profile.js');

const authMiddleware = require('../app/middlewares/authMiddleware');
const upload = require('../app/helper/upload.js');

router.get('/', authMiddleware, getDashboardData);

router.get('/profile', authMiddleware, viewProfile);
router.patch('/profile', authMiddleware, (req, res, next) => { req.uploadType = 'profile'; next(); }, upload.single('file'), editProfile);

module.exports = router;