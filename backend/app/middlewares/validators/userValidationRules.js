const { body } = require("express-validator");

const userValidationRules = {
    searchUsers: [
        body("input")
            .trim()
            .notEmpty().withMessage("Search input is required")
            .isLength({ min: 2 }).withMessage("Search input must be at least 2 characters")
            .isLength({ max: 100 }).withMessage("Search input must be at most 100 characters")

    ]
};

module.exports = userValidationRules;