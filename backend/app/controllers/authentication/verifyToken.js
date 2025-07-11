const jwt = require('jsonwebtoken');
const { successResponse, errorResponse, errorThrowResponse } = require("../../helper/response");
const { User } = require("../../models");

const verifyToken = async (req, res) => {
    try {
        const { email, token } = req.body;

        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            return unAuthorizedResponse(res, "No such users found");
        };

        if (user.token == token && user.token_expires > new Date()) {
            user.token = null;
            user.token_expires = null;

            if(!user.is_verified) {
                user.is_verified = true;
            }
            await user.save();

            const userObject = {
                id: user.id,
                name: user.name,
                email: user.email,
            }
            const userToken = jwt.sign(userObject, process.env.JWT_SECRET);
            return successResponse(res, userToken, "OTP verified");
        }
        else {
            return errorResponse(res, "Invalid or Expired OTP, please try again.");
        }
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

module.exports = {
    verifyToken
}