const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {

    const token = req.headers?.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized"
        })
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        // console.log(user);
        next();
    } catch (error) {
        return res.status(403).json({
            status: "error",
            message: "Invalid or expired token",
        });
    }


}

module.exports = authMiddleware;