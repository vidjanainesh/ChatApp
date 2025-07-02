const jwt = require('jsonwebtoken');
const generator = require('generate-password');
const nodemailer = require('nodemailer')
const User = require('../../../app/models/users');
const bcrypt = require('bcrypt');

const {
    successResponse,
    successPostResponse,
    errorThrowResponse
} = require("../../helper/response");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const register = async (req, res) => {
    try {
        // console.log(req.body);
        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        // console.log(hashedPassword);

        const user = await User.findOne({
            where: { email: email.trim().toLowerCase() },
            raw: true
        });

        if (user) {
            throw new Error('User with the same email already exists');
        }

        await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
        });

        return successPostResponse(res, {}, "User Registered");

    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const login = async (req, res) => {
    try {
        // console.log(req.body);
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email: email },
            raw: true
        });

        if (!user) throw new Error('No users with given email exists!');

        // console.log(user);
        // console.log(hashedPassword);

        const match = await bcrypt.compare(password, user.password);

        const userToken = jwt.sign(user, process.env.JWT_SECRET);

        if (match) {
            return successResponse(res, userToken, "User Logged In");
        } else {
            throw new Error('Password did not match');
        }

    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const googleLogin = async (req, res) => {
    try {
        const { name, email } = req.body;

        const existing = await User.findOne({ where: {email}, raw: true });
        
        if (existing) {
            const userToken = jwt.sign(existing, process.env.JWT_SECRET);
            return successResponse(res, userToken, "User Logged In");
        }

        else {
            const password = generator.generate({
                length: 12,
                numbers: true,
                symbols: true,
                uppercase: true,
                lowercase: true,
                strict: true
            });

            const hashedPassword = await bcrypt.hash(password, 10);

            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Your New Password - Keep it Secure',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                    <h2 style="color: #333; text-align: center;">Your Password Has Been Generated</h2>
                    <p>Hello,</p>
                    <p>As per your request, we have generated a new password for your account. Please use this password to log in, and we strongly recommend changing it immediately after logging in for security reasons.</p>
                    
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50; text-align: center; padding: 12px 0; background-color: #ffffff; border: 1px dashed #ccc; margin: 20px 0;">
                        ${password}
                    </div>

                    <p>If you did not request this password reset, please contact our support team immediately.</p>

                    <p>Thank you,<br>The Pavans Team</p>

                    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
                        &copy; ${new Date().getFullYear()} Pavans. All rights reserved.
                    </div>
                </div>
            `
            };
            await transporter.sendMail(mailOptions);

            const user = await User.create({
                name,
                email,
                password: hashedPassword,
            });

            const userToken = jwt.sign(user.toJSON(), process.env.JWT_SECRET);
            return successResponse(res, userToken, "User Registerd and Logged In");
        }
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

module.exports = {
    register,
    login,
    googleLogin,
};