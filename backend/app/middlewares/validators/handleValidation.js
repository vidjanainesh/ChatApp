const {validationResult} = require('express-validator');

const handleValidation = async (req, res, next) => {
    const errors = validationResult(req);
    if(errors.isEmpty()) next();
    else{
        const errorMessages = errors.array().map(curr => curr.msg);
        return res.status(400).json({
            message: errorMessages[0],
            errors: errorMessages
        })
    }
}

module.exports = handleValidation;