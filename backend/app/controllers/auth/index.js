const jwt = require('jsonwebtoken');
const generator = require('generate-password');
const nodemailer = require('nodemailer')
const { User } = require('../../models');
const bcrypt = require('bcrypt');

const {
    successResponse,
    successPostResponse,
    errorThrowResponse,
    errorResponse,
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
        const { name, email, password, phoneNo } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const token = Math.floor(1000 + Math.random() * 9000);
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

        const user = await User.findOne({
            where: { email: email },
        });

        if (user) {
            if (user.is_verified) {
                return errorResponse(res, 'User with the same email already exists');

            } else {

                user.token = token;
                user.token_expires = tokenExpires;
                await user.save();

                const mailOptions = {
                    from: process.env.EMAIL,
                    to: email,
                    subject: 'Verify Your Email - Complete Your Registration',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                            <h2 style="color: #333;">Welcome to Pavans Team!</h2>
                            <p>Hello,</p>
                            <p>To complete your registration and activate your account, please verify your email using the code below.</p>
                            
                            <div style="font-size: 24px; font-weight: bold; color: #2c3e50; text-align: center; padding: 10px 0; background-color: #ffffff; border: 1px dashed #ccc; margin: 20px 0;">
                                ${token}
                            </div>

                            <p>This verification code is valid for <strong>15 minutes</strong>.</p>
                            
                            <p>If you did not create an account with us, please ignore this email.</p>
                            
                            <p>Thank you,<br>The ChatApp Team</p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);

                return successResponse(res, email, "Already registered - Pending email verification");
            }
        }

        await User.create({
            name: name,
            email: email,
            password: hashedPassword,
            phone_no: phoneNo,
            token: token,
            token_expires: tokenExpires,
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Verify Your Email - Complete Your Registration',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                    <h2 style="color: #333;">Welcome to Pavans Team!</h2>
                    <p>Hello,</p>
                    <p>Thank you for registering with us. To complete your registration and activate your account, please verify your email using the code below.</p>
                    
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50; text-align: center; padding: 10px 0; background-color: #ffffff; border: 1px dashed #ccc; margin: 20px 0;">
                        ${token}
                    </div>

                    <p>This verification code is valid for <strong>15 minutes</strong>.</p>
                    
                    <p>If you did not create an account with us, please ignore this email.</p>
                    
                    <p>Thank you,<br>The ChatApp Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return successPostResponse(res, email, "Verify your email to complete registration");

    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const login = async (req, res) => {
    try {
        // console.log(req.body);
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email: email, is_verified: true },
            raw: true
        });

        if (!user) throw new Error('No users with given email exists!');

        // console.log(user);
        // console.log(hashedPassword);

        const match = await bcrypt.compare(password, user.password);

        const userObject = {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNo: user.phone_no,
            profileImageUrl: user.profile_image_url,
        }

        const userToken = jwt.sign(userObject, process.env.JWT_SECRET);

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

        const existing = await User.findOne({
            where: { email, is_verified: true },
            attributes: ['id', 'name', 'email', ['profile_image_url', 'profileImageUrl'], ['phone_no', 'phoneNo']],
            raw: true
        });

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
                is_verified: true,
            });

            const userObject = {
                id: user.id,
                name: user.name,
                email: user.email,
                profileImageUrl: user.profile_image_url,
                phoneNo: user.phone_no,
            }

            const userToken = jwt.sign(userObject, process.env.JWT_SECRET);
            return successResponse(res, userToken, "User Registered and Logged In");
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