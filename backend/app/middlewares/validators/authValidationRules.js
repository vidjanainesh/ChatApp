const { body } = require('express-validator');

const authenticationValidationRules = {
  register: [
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 2 }).withMessage("Name should be at least 2 characters long"),

    body("email")
      .trim()
      .customSanitizer(value => value.toLowerCase())
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email address")
      .matches(/^(?!.*\.\.)[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/)
      .withMessage("Invalid email!")
      .custom((value) => {
        if (value.endsWith(".com.com")) {
          throw new Error("Invalid email!");
        }
        return true;
      }),

    body("password")
      .trim()
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 8 }).withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&_])[A-Za-z\d@$!%*?#&_]{8,}$/)
      .withMessage("Password must contain minimum 8 characters, at least one uppercase, one lowercase, one digit, one special character!")
  ],

  login: [
    body("email")
      .trim()
      .customSanitizer(value => value.toLowerCase())
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email")
      .matches(/^(?!.*\.\.)[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/)
      .withMessage("Invalid email!")
      .custom((value) => {
        if (value.endsWith(".com.com")) {
          throw new Error("Invalid email!");
        }
        return true;
      }),

    body("password")
      .trim()
      .notEmpty().withMessage("Password is required"),
  ],

  forgetPassword: [
    body("email")
      .trim()
      .customSanitizer(value => value.toLowerCase())
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email"),
  ],

  verifyToken: [
    body("email")
      .trim()
      .customSanitizer(value => value.toLowerCase())
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email"),

    body("token")
      .notEmpty().withMessage("Token is required")
      .isNumeric().withMessage("Token must be a number"),
  ],

  resetPassword: [
    body("password")
      .trim()
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
};

// const validateEmailMiddleware = (req, res, next) => {
//     try{
//         // console.log('From middleware', req.body);
//         const {email} = req.body;

//         const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

//         if(!email || !emailRegex.test(email) || email.endsWith('.com.com')){
//             throw new Error('Invalid Email');
//         }

//         next();
//     }
//     catch(err){
//         return res.status(400).json({
//             status: "error",
//             message: err.message
//         })
//     }
// }


// const validatePasswordMiddleware = (mode = 'login') => {

//     return (req, res, next) => {
//         try{
//             // console.log('From middleware', req.body);

//             const {password} = req.body;

//             const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&_])[A-Za-z\d@$!%*?#&_]{8,}$/;

//             if(!password) throw new Error('Password is required');

//             if( mode === 'register' && !passwordRegex.test(password)){
//                 throw new Error('Password must contain minimum 8 characters, at least one uppercase, one lowercase, one digit, one special character');
//             }

//             next();
//         }
//         catch(err){
//             return res.status(400).json({
//                 status: "error",
//                 message: err.message
//             })
//         }

//     }
// }



module.exports = {
  // validateEmailMiddleware,
  // validatePasswordMiddleware,
  authenticationValidationRules
}