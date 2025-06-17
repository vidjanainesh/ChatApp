const { body } = require("express-validator");

const friendValidationRules = {
  sendFriendReq: [
    body("id")
      .notEmpty().withMessage("Receiver ID is required")
      .isInt({ min: 1 }).withMessage("Receiver ID must be a valid positive integer"),
  ],

  manageFriendReq: [
    body("id")
      .notEmpty().withMessage("Sender ID is required")
      .isInt({ min: 1 }).withMessage("Sender ID must be a valid positive integer"),

    body("status")
      .notEmpty().withMessage("Status is required")
      .isIn(["accepted", "rejected"]).withMessage("Status must be 'accepted' or 'rejected'"),
  ]
};

module.exports = friendValidationRules;
