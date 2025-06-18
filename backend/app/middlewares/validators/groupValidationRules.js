const { body, param } = require("express-validator");

const groupValidationRules = {
  // For creating a group
  createGroup: [
    body("name")
      .notEmpty().withMessage("Group name is required")
      .isLength({ min: 1, max: 255 }).withMessage("Group name must be between 1 and 255 characters"),

    body("memberIds")
      .isArray({ min: 1 }).withMessage("memberIds must be a non-empty array")
      .custom((arr) => arr.every(id => Number.isInteger(id) && id > 0))
      .withMessage("Each member ID must be a positive integer"),
  ],

  // For sending a message to a group
  sendGroupMessage: [
    body("groupId")
      .notEmpty().withMessage("Group ID is required")
      .isInt({ min: 1 }).withMessage("Group ID must be a valid positive integer"),

    body("message")
      .notEmpty().withMessage("Message is required")
      .isLength({ min: 1, max: 1000 }).withMessage("Message must be between 1 and 1000 characters"),
  ],

  // For fetching messages from a group by ID
  getGroupMessages: [
    param("id")
      .notEmpty().withMessage("Group ID is required in URL")
      .isInt({ min: 1 }).withMessage("Group ID must be a valid positive integer"),
  ],

  // For fetching members of a group by ID
  getGroupMembers: [
    param("id")
      .notEmpty().withMessage("Group ID is required in URL")
      .isInt({ min: 1 }).withMessage("Group ID must be a valid positive integer"),
  ]
};

module.exports = groupValidationRules;