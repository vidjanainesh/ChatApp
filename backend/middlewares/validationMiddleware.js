const validateEmailMiddleware = (req, res, next) => {
    try{
        // console.log('From middleware', req.body);
        const {email} = req.body;

        const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

        if(!email || !emailRegex.test(email) || email.endsWith('.com.com')){
            throw new Error('Invalid Email');
        }

        next();
    }
    catch(err){
        return res.status(400).json({
            status: "error",
            message: err.message
        })
    }
}


const validatePasswordMiddleware = (mode = 'login') => {

    return (req, res, next) => {
        try{
            // console.log('From middleware', req.body);

            const {password} = req.body;

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&_])[A-Za-z\d@$!%*?#&_]{8,}$/;

            if(!password) throw new Error('Password is required');

            if( mode === 'register' && !passwordRegex.test(password)){
                throw new Error('Password must contain minimum 8 characters, at least one uppercase, one lowercase, one digit, one special character');
            }

            next();
        }
        catch(err){
            return res.status(400).json({
                status: "error",
                message: err.message
            })
        }

    }
}

module.exports = {
    validateEmailMiddleware,
    validatePasswordMiddleware
}