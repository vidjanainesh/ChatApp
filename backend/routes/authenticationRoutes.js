const express = require('express');
const router = express.Router();

const {
    register,
    login
} = require('../controllers/authentication');

const {
    forgetPassword,
    verifyToken,
    resetPassword,
} = require('../controllers/authentication/forgetPassword');

const {
    validateEmailMiddleware,
    validatePasswordMiddleware
} = require('../middlewares/validationMiddleware');

router.post('/register', validateEmailMiddleware, validatePasswordMiddleware('register'), register);
router.post('/login', validateEmailMiddleware, validatePasswordMiddleware('login'), login);

router.post('/forget-password', validateEmailMiddleware, forgetPassword);
router.post('/verify-token', verifyToken);
router.post('/reset-password', validatePasswordMiddleware('register'), resetPassword);

module.exports = router;