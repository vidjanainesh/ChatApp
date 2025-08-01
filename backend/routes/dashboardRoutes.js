const express = require('express');
const router = express.Router();

const getDashboardData = require('../app/controllers/dashboard');
const { viewProfile, editProfile } = require('../app/controllers/dashboard/profile');

const authMiddleware = require('../app/middlewares/authMiddleware');

const dashboardValidationRules = require('../app/middlewares/validators/dashboardValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');
const upload = require('../app/helper/upload.js');

router.get('/', authMiddleware, getDashboardData);

router.get('/profile', authMiddleware, viewProfile);
router.get('/profile/:id', authMiddleware, viewProfile);
router.patch('/profile', authMiddleware, (req, res, next) => { req.uploadType = 'profile'; next(); }, upload.single('file'), dashboardValidationRules.editProfile, handleValidation, editProfile);

module.exports = router;