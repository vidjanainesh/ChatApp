const express = require('express');
const router = express.Router();

const {
    register,
    login,
    googleLogin,
} = require('../app/controllers/auth');

const {
    forgetPassword,
    resetPassword,
} = require('../app/controllers/auth/forgetPassword');

const {
    verifyToken
} = require('../app/controllers/auth/verifyToken');

const { authenticationValidationRules } = require('../app/middlewares/validators/authValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/register', authenticationValidationRules.register, handleValidation, register);
router.post('/login', authenticationValidationRules.login, handleValidation, login);
router.post('/google-login', googleLogin);

router.post('/forget-password', authenticationValidationRules.forgetPassword, handleValidation, forgetPassword);
router.post('/verify-token', authenticationValidationRules.verifyToken, handleValidation, verifyToken);
router.post('/reset-password', authenticationValidationRules.resetPassword, handleValidation, resetPassword);

module.exports = router;