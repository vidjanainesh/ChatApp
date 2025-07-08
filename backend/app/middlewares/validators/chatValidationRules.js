const { body, param } = require("express-validator");

const chatValidationRules = {
  sendMessage: [
    // body("message")
    //   .notEmpty().withMessage("Message content is required")
    //   .isLength({ min: 1, max: 1000 }).withMessage("Message must be between 1 and 1000 characters"),

    body("receiverId")
      .notEmpty().withMessage("Receiver ID is required")
      .isInt({ min: 1 }).withMessage("Receiver ID must be a valid integer"),
  ],

  getMessages: [
    param("id")
      .notEmpty().withMessage("User ID is required in URL")
      .isInt({ min: 1 }).withMessage("User ID must be a valid integer"),
  ],

  deleteMessage: [
    param("id")
      .notEmpty().withMessage("Message ID is required in URL")
      .isInt({ min: 1 }).withMessage("Message ID must be a valid integer"),
  ],

  editMessage: [
    body("msg")
      .notEmpty().withMessage("Message content is required")
      .isLength({ min: 1, max: 1000 }).withMessage("Message must be between 1 and 1000 characters"),

    param("id")
      .notEmpty().withMessage("Message ID is required in URL")
      .isInt({ min: 1 }).withMessage("Message ID must be a valid integer"),
  ],

};

module.exports = chatValidationRules;
