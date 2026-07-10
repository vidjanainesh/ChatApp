const { Op, Sequelize } = require("sequelize");
const { Message, User, Friends, MessageReactions } = require("../../models");
const {
    successResponse,
    errorResponse,
    unAuthorizedResponse,
    errorThrowResponse,
} = require("../../helper/response");
const sequelize = require("../../models/database");
const cloudinary = require('../../helper/cloudinary');
const { encryptMessage, decryptMessage } = require("../../helper/encryption");
const { toCamelCase } = require("../../helper/helper");
const FriendService = require("../../services/FriendService");
const MessageService = require("../../services/MessageService");

const sendMessage = async (req, res) => {
    try {
        const { message, receiverId } = req.body;
        const replyTo = req.body.replyTo || null;
        const user = req.user;
        const file = req?.file || null;
        const io = req.app.get("io");
        // console.log(message, receiverId, user);

        if (!message && !file) {
            return unAuthorizedResponse(res, "Message content or File is required");
        };

        if (!receiverId) {
            return unAuthorizedResponse(res, "Receiver ID is required");
        }

        const friendship = await FriendService.getFriendship(req.user.id, receiverId);
        if (!friendship) {
            return errorResponse(res, "Not friends with this user");
        }

        const payload = await MessageService.sendMessage({
            sender: req.user,
            receiverId,
            message,
            replyTo,
            file: req.file || null,
            io: req.app.get("io"),
        });

        return successResponse(res, payload, "Message sent");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const deleteMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;

        const message = await Message.findOne({ where: { id } });

        if (message.sender_id !== user.id) {
            return errorResponse(res, 'Invalid user');
        }

        message.is_deleted = true;
        await message.save();

        await MessageReactions.destroy({
            where: { target_id: id, target_type: 'private' }
        })

        let rawMessage = message.toJSON(); // Convert Sequelize model to plain object
        rawMessage = {
            ...rawMessage,
            message: decryptMessage(rawMessage.message, rawMessage.iv),
        }
        delete rawMessage.iv;

        const camelCasedMessage = toCamelCase(rawMessage);

        const io = req.app.get("io");
        const receiverRoom = `user_${message.receiver_id}`;
        const senderRoom = `user_${message.sender_id}`;

        io.to(receiverRoom).emit("deleteMessage", camelCasedMessage);
        // io.to(senderRoom).emit("deleteMessage", camelCasedMessage);

        return successResponse(res, camelCasedMessage, "Message deleted successfully")
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const editMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const { msg } = req.body;
        const user = req.user;

        const message = await Message.findOne({ where: { id, is_deleted: false } });
        if (!message) return errorResponse(res, 'Invalid Message')

        if (message.sender_id !== user.id) {
            return errorResponse(res, 'Invalid user');
        }

        const { encryptedData, iv } = encryptMessage(msg); // Encryption

        message.message = encryptedData;
        message.iv = iv;
        message.is_edited = true;
        message.updatedAt = new Date();
        await message.save();

        let rawMessage = message.toJSON(); // Convert Sequelize model to plain object

        rawMessage = {
            ...rawMessage,
            message: decryptMessage(rawMessage.message, rawMessage.iv)
        }
        delete rawMessage.iv;

        const camelCasedMessage = toCamelCase(rawMessage);

        const io = req.app.get("io");
        const receiverRoom = `user_${message.receiver_id}`;
        // const senderRoom = `user_${message.sender_id}`;s

        io.to(receiverRoom).emit("editMessage", camelCasedMessage);
        // io.to(senderRoom).emit("editMessage", camelCasedMessage);

        return successResponse(res, camelCasedMessage, "Message edited successfully");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const getMessages = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const beforeId = req.query.beforeId;

        if (!id) {
            return unAuthorizedResponse(res, "Person ID is required");
        }

        const friendship = await Friends.findOne({
            where: {
                [Op.or]: [
                    {
                        [Op.and]: [
                            { sender_id: user.id },
                            { receiver_id: id }
                        ]
                    },
                    {
                        [Op.and]: [
                            { sender_id: id },
                            { receiver_id: user.id }
                        ]
                    }
                ]
            },
            attributes: ['status']
        });

        const friend = await User.findOne({
            where: { id },
            attributes: ['id', 'name', 'email', ['profile_image_url', 'profileImageUrl']]
        });

        const whereClause = {
            is_deleted: false,
            [Op.or]: [
                {
                    [Op.and]: [
                        { sender_id: user.id },
                        { receiver_id: id }
                    ]
                },
                {
                    [Op.and]: [
                        { sender_id: id },
                        { receiver_id: user.id }
                    ]
                }
            ]
        }

        if (beforeId) {
            whereClause.id = { [Op.lt]: beforeId };  // fetch older than last id
        }

        const messages = await Message.findAll({
            where: whereClause,
            include: [
                {
                    model: Message,
                    as: 'repliedMessage',
                    attributes: ['id', 'message', 'iv'],
                    // where: {is_deleted: false},
                }
            ],
            order: [['id', 'DESC']],
            attributes: [
                'id',
                ['sender_id', 'senderId'],
                ['receiver_id', 'receiverId'],
                'message',
                'iv',
                ['file_url', 'fileUrl'],
                ['file_type', 'fileType'],
                ['file_name', 'fileName'],
                ['file_size', 'fileSize'],
                ['file_blur_url', 'fileBlurUrl'],
                ['is_read', 'isRead'],
                ['read_at', 'readAt'],
                ['is_deleted', 'isDeleted'],
                ['is_edited', 'isEdited'],
                'createdAt',
                'updatedAt'
            ],
            limit: 15
        });

        let allMessages = messages.map(msg => msg.toJSON());

        allMessages = allMessages.map((msg) => {
            let decryptedRepliedMessage;
            if (msg.repliedMessage) {
                decryptedRepliedMessage = decryptMessage(msg.repliedMessage.message, msg.repliedMessage.iv);
                msg.repliedMessage = {
                    ...msg.repliedMessage,
                    message: decryptedRepliedMessage,
                }
                delete msg.repliedMessage.iv; // No need to send iv to frontend
            }
            return msg;
        })

        // Get message reactions for each message
        const messageIds = allMessages.map((msg) => msg.id);
        let messageReactions = await MessageReactions.findAll({
            where: { target_id: messageIds, target_type: 'private' },
            attributes: [
                'id',
                'target_id',
                'target_type',
                'user_id',
                'reaction',
                'createdAt'
            ],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name']
                }
            ],
            raw: true,
            nest: true
        });

        messageReactions = messageReactions.map((curr) => (
            {
                reactionId: curr.id,
                messageId: curr.target_id,
                userId: curr.user_id,
                userName: curr.user.name,
                reaction: curr.reaction,
                createdAt: curr.createdAt,
                targetType: curr.target_type
            }
        ))

        // Prepare the final object that attaches all the responses to each message
        let response = allMessages.map((msg) => {
            const newMsg = ({
                ...msg,
                message: decryptMessage(msg.message, msg.iv),
                isRead: Boolean(msg.isRead),
                isEdited: Boolean(msg.isEdited),
                isDeleted: Boolean(msg.isDeleted),
                temp: false,
                reactions: [],
            })
            delete newMsg.iv; // No need to send iv to frontend

            messageReactions.map((reaction) => {
                if (msg.id === reaction.messageId) newMsg.reactions.push(reaction);
            });
            return newMsg;
        })

        // // Update is_read to true
        // await Message.update(
        //     { is_read: true },
        //     {
        //         where: {
        //             sender_id: id,
        //             receiver_id: user.id,
        //             is_read: false,
        //         },
        //     }
        // );

        return successResponse(res, { friend, friendship: friendship?.status, messages: response.reverse() }, "All messages retrieved between the two people");

    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

module.exports = {
    sendMessage,
    deleteMessage,
    editMessage,
    getMessages,
}