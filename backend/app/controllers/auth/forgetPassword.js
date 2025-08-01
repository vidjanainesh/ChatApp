const nodemailer = require('nodemailer');
const User = require('../../models/users');
const { token } = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  successResponse,
  errorResponse,
  unAuthorizedResponse
} = require("../../helper/response");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const forgetPassword = async (req, res) => {
    
    try {
        const { email } = req.body;

        const token = Math.floor(1000 + Math.random() * 9000);
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); 

        const user = await User.findOne({where: {email, is_verified: true}});
        
        if(!user) {
            return unAuthorizedResponse(res, "No such users found");
        };

        user.token = token;
        user.token_expires = tokenExpires;

        await user.save();

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your One-Time Password (OTP) - Valid for 15 Minutes',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Use the code below to proceed. This OTP is valid for <strong>15 minutes</strong>.</p>
                
                <div style="font-size: 24px; font-weight: bold; color: #2c3e50; text-align: center; padding: 10px 0; background-color: #ffffff; border: 1px dashed #ccc; margin: 20px 0;">
                    ${token}
                </div>

                <p>If you did not request a password reset, please ignore this email. No changes will be made to your account.</p>
                
                <p>Thank you,<br>The ChatApp Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        return successResponse(res, {}, "Check mail for OTP");   

    } catch (error) {
       return errorResponse(res, error.message, 500);
    }
}

const resetPassword = async (req, res) => {
    try {

        const {password, email} = req.body;
        // const token = req.headers.authorization?.split(' ')[1]; // Bearer token
        // console.log(password);
        // console.log(token);
        if(!token) {
            return unAuthorizedResponse(res, "Reset token missing");
        }

        const user = await User.findOne({where: {email, is_verified: true}});
        if(!user) return unAuthorizedResponse(res, "No such users found");

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.update({
            password: hashedPassword,
            token: null,
            token_expires: null,
        }, {
            where: {email: email}
        });

        // const user = await User.findOne({email});

        return successResponse(res, {}, "Password is reset, you can login with new password");
        
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

module.exports = {
    forgetPassword,
    resetPassword
}