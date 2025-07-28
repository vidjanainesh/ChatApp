const { body } = require('express-validator');

const authenticationValidationRules = {
  register: [
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 2 }).withMessage("Name should be at least 2 characters long")
      .customSanitizer(value => {
        return value
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }),

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
      .withMessage("Password must contain minimum 8 characters, at least one uppercase, one lowercase, one digit, one special character!"),

    body("phoneNo")
      .notEmpty().withMessage("Phone number is required")
      .isMobilePhone().withMessage("Invalid phone number")
      .isLength({ min: 10, max: 10 }).withMessage("Phone number should be 10 digits"),

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
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&_])[A-Za-z\d@$!%*?#&_]{8,}$/)
      .withMessage("Password must contain at least one uppercase, one lowercase, one digit, one special character"),
  ],
};

module.exports = {
  authenticationValidationRules
}