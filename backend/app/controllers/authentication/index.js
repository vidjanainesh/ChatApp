const jwt = require('jsonwebtoken');
const User = require('../../../app/models/users');
const bcrypt = require('bcrypt');

const {
  successResponse,
  successPostResponse,
  errorResponse
} = require("../../helper/response");

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
        return errorResponse(res, `${error.message}`, 400);
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
        return errorResponse(res, error.message, 400);
    }
}

module.exports = {
    register,
    login
};