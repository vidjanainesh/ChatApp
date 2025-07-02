const express = require('express');
const router = express.Router();

const {
    register,
    login,
    googleLogin,
} = require('../app/controllers/authentication');

const {
    forgetPassword,
    verifyToken,
    resetPassword,
} = require('../app/controllers/authentication/forgetPassword');

const { authenticationValidationRules } = require('../app/middlewares/validators/authValidationRules');
const handleValidation = require('../app/middlewares/validators/handleValidation');

router.post('/register', authenticationValidationRules.register, handleValidation, register);
router.post('/login', authenticationValidationRules.login, handleValidation, login);
router.post('/google-login', googleLogin);

router.post('/forget-password', authenticationValidationRules.forgetPassword, handleValidation, forgetPassword);
router.post('/verify-token', authenticationValidationRules.verifyToken, handleValidation, verifyToken);
router.post('/reset-password', authenticationValidationRules.resetPassword, handleValidation, resetPassword);

module.exports = router;