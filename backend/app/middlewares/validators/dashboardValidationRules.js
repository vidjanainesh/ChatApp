const { body } = require("express-validator");

const dashboardValidationRules = {

    editProfile: [
        body("name")
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage("Name must be 2 to 50 characters"),

        body("phoneNo")
            .optional()
            .isLength({ min: 10, max: 10 }).withMessage("Phone number must be exactly 10 digits")
            .isNumeric().withMessage("Phone number must contain only digits"),

        body("dob")
            .optional()
            .isISO8601().withMessage("Date of birth must be in valid ISO8601 format (e.g., YYYY-MM-DD)"),

        body("gender")
            .optional()
            .isIn(["male", "female", "other"]).withMessage("Gender must be one of: male, female, other"),

        body("address")
            .optional()
            .isLength({ min: 3, max: 255 }).withMessage("Address must be 3 to 255 characters long"),
    ],
};

module.exports = dashboardValidationRules;