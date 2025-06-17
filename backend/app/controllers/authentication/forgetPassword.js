const nodemailer = require('nodemailer');
const User = require('../../../app/models/users');
const { token } = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
    
        // await User.update({
        //     token: token,
        //     token_expires: tokenExpires
        // }, {
        //     where: {email: email}
        // });

        const user = await User.findOne({where: {email}});
        
        if(!user) {
            return res.status(401).json({
                status: "error",
                message: "No such users found"
            })
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
                <p>You requested to reset your password. Use the OTP below to proceed. This OTP is valid for <strong>15 minutes</strong>.</p>
                
                <div style="font-size: 24px; font-weight: bold; color: #2c3e50; text-align: center; padding: 10px 0; background-color: #ffffff; border: 1px dashed #ccc; margin: 20px 0;">
                    ${token}
                </div>

                <p>If you did not request a password reset, please ignore this email. No changes will be made to your account.</p>
                
                <p>Thank you,<br>Pavans Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        // const user = await User.findOne({email});
        res.status(200).json({
            status: "success",
            message: "Check mail for OTP"
        });   

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        }); 
    }
}

const verifyToken = async (req, res) => {
    try {
        const {email, token} = req.body;

        const user = await User.findOne({
            where: {email},
            raw: true
        });
        console.log(user);

        if(user.token == token && user.token_expires > new Date()){
            const emailToken = jwt.sign(
                {email}, 
                process.env.JWT_SECRET, 
                {expiresIn: '15m'},
            )
            res.status(200).json({
                "status": "success",
                "message": "OTP verified",
                emailToken
            })
        }
        else{
            res.status(400).json({
                "status": "error",
                "message": "Invalid or Expired OTP"
            })
        }
    } catch (error) {
        res.status(500).json({
            "status": "error",
            "message": error.message
        });
    }
}

const resetPassword = async (req, res) => {
    try {

        const {password} = req.body;
        const token = req.headers.authorization?.split(' ')[1]; // Bearer token
        // console.log(password);
        // console.log(token);
        if(!token) {
            return res.status(401).json({ 
                status: "error", 
                message: "Reset token missing" 
            });
        }

        const decode = jwt.decode(token, process.env.JWT_SECRET);
        const email = decode.email;

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.update({
            password: hashedPassword,
            token: null,
            token_expires: null,
        }, {
            where: {email: email}
        });

        // const user = await User.findOne({email});

        res.status(200).json({
            status: "success",
            message: "Password is reset, you can login with new password"
        });
        
    } catch (error) {
        res.status(500).json({
            "status": "error",
            "message": error.message
        });
    }
}

module.exports = {
    forgetPassword,
    verifyToken,
    resetPassword
}