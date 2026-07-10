const { Op } = require("sequelize");
const { User, Message } = require("../models");
const { toCamelCase } = require("../helper/helper");
const { decryptMessage, encryptMessage } = require("../helper/encryption");

class MessageService {
    static async sendMessage({
        sender,
        receiverId,
        message,
        io,
        replyTo = null,
        file = null,
    }) {

        let fileUrl = null;
        let fileType = null;
        let fileName = null;
        let fileSize = null;

        if (!message && !file) {
            throw new Error("Message content or file is required.");
        }

        if (!receiverId) {
            throw new Error("Receiver ID is required.");
        }

        let encryptedData = null;
        let iv = null;

        if (message) {
            const encryption = encryptMessage(message);
            encryptedData = encryption.encryptedData;
            iv = encryption.iv;
        }

        if (file) {
            fileUrl = file.path;
            fileType = file.mimetype.startsWith("image")
                ? "image"
                : file.mimetype.startsWith("video")
                    ? "video"
                    : "file";

            fileName = file.originalname;
            fileSize = file.size;
        }

        const sentMessage = await Message.create({
            sender_id: sender.id,
            receiver_id: receiverId,
            message: encryptedData,
            iv,
            reply_to: replyTo,
            file_url: fileUrl,
            file_type: fileType,
            file_name: fileName,
            file_size: fileSize,
        });

        let repliedMessage = null;

        if (replyTo) {
            repliedMessage = await Message.findOne({
                where: { id: replyTo },
                attributes: ["id", "message", "iv"],
                raw: true,
            });

            if (repliedMessage) {
                repliedMessage.message = decryptMessage(
                    repliedMessage.message,
                    repliedMessage.iv
                );

                delete repliedMessage.iv;
            }
        }

        let rawMessage = sentMessage.toJSON();

        rawMessage = {
            ...rawMessage,
            message,
        };

        delete rawMessage.iv;

        const camelCasedMessage = toCamelCase(rawMessage);

        const messageWithSender = {
            ...camelCasedMessage,
            temp: false,
            isDeleted: false,
            isEdited: false,
            isRead: false,
            readAt: null,
            reactions: [],
            repliedMessage,
            senderName: sender.name || sender.email || "Unknown",
        };

        const payload = {
            message: messageWithSender,
        };

        if (io) {
            io.to(`user_${receiverId}`).emit("newMessage", payload);
        }

        return payload;
    }
}

module.exports = MessageService;