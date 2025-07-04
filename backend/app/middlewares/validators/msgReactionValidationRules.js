const { body, param } = require("express-validator");

const reactionValidationRules = {
  reactMessage: [
    param("id")
      .notEmpty().withMessage("Message ID is required in URL")
      .isInt({ min: 1 }).withMessage("Message ID must be a valid positive integer"),

    body("targetType")
      .notEmpty().withMessage("Target type is required")
      .isIn(["private", "group"]).withMessage("Target type must be 'private' or 'group'"),

    body("reaction")
      .trim()
      .notEmpty().withMessage("Reaction is required")
      .isLength({ min: 1, max: 50 }).withMessage("Reaction must be between 1 and 50 characters"),
  ],

  deleteReactions: [
    param("id")
      .notEmpty().withMessage("Message ID is required in URL")
      .isInt({ min: 1 }).withMessage("Message ID must be a valid positive integer"),
  ]
};

module.exports = reactionValidationRules;