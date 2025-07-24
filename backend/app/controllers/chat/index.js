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

const toCamelCase = (obj) => {
    const camelCaseObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
        camelCaseObj[camelKey] = obj[key];
    }
    return camelCaseObj;
};

const sendMessage = async (req, res) => {
    try {
        const { message, receiverId } = req.body;
        const replyTo = req.body.replyTo || null;
        const user = req.user;
        const file = req?.file;
        // console.log(message, receiverId, user);
        let fileUrl = null;
        // let fileBlurUrl = null;
        let fileType = null;
        let fileName = null;
        let fileSize = null;

        if (!message && !file) {
            return unAuthorizedResponse(res, "Message content or File is required");
        };

        if (!receiverId) {
            return unAuthorizedResponse(res, "Receiver ID is required");
        }

        if (file) {
            fileUrl = file.path;
            fileType = file.mimetype.startsWith("image") ? "image" : file.mimetype.startsWith("video") ? "video" : "file";
            fileName = file.originalname;
            fileSize = file.size;

            // // generate blur url using public_id
            // const publicId = `${file.filename}`; // 'chatapp_uploads/...'
            // fileBlurUrl = cloudinary.url(publicId, {
            //     transformation: [
            //         { width: 20, quality: "auto" },
            //         { effect: "blur:500" }
            //     ],
            //     format: "jpg",
            //     secure: true,
            // });
        }

        const friendship = await Friends.findOne({
            where: {
                status: "accepted",
                [Op.or]: [
                    { sender_id: user.id, receiver_id: receiverId },
                    { sender_id: receiverId, receiver_id: user.id }
                ]
            }
        });

        if (!friendship) {
            return errorResponse(res, "Not friends with this user");
        }

        const sentMessage = await Message.create({
            sender_id: parseInt(user.id),
            receiver_id: parseInt(receiverId),
            message: message || null,
            reply_to: replyTo,
            file_url: fileUrl,
            file_type: fileType,
            file_name: fileName,
            file_size: fileSize,
            // file_blur_url: fileBlurUrl
        });

        const repliedMessage = await Message.findOne({ where: { id: replyTo }, attributes: ['id', 'message'], raw: true });

        const io = req.app.get("io");
        const receiverRoom = `user_${receiverId}`;
        const senderRoom = `user_${user.id}`;

        const rawMessage = sentMessage.toJSON(); // Convert Sequelize model to plain object
        const camelCasedMessage = toCamelCase(rawMessage); // Convert keys to camelCase

        // Final object
        const messageWithSender = {
            ...camelCasedMessage,
            temp: false,
            isDeleted: false,
            isEdited: false,
            isRead: false,
            readAt: null,
            reactions: [],
            repliedMessage,
            senderName: user.name || user.email || "Unknown",
        };

        const payload = {
            message: messageWithSender,
        };

        io.to(receiverRoom).emit("newMessage", payload);
        // io.to(senderRoom).emit("newMessage", payload);

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

        const rawMessage = message.toJSON(); // Convert Sequelize model to plain object
        const camelCasedMessage = toCamelCase(rawMessage);

        const io = req.app.get("io");
        const receiverRoom = `user_${message.receiver_id}`;
        const senderRoom = `user_${message.sender_id}`;

        io.to(receiverRoom).emit("deleteMessage", camelCasedMessage);
        io.to(senderRoom).emit("deleteMessage", camelCasedMessage);

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

        message.message = msg;
        message.is_edited = true;
        message.updatedAt = new Date();
        await message.save();

        const rawMessage = message.toJSON(); // Convert Sequelize model to plain object
        const camelCasedMessage = toCamelCase(rawMessage);

        const io = req.app.get("io");
        const receiverRoom = `user_${message.receiver_id}`;
        const senderRoom = `user_${message.sender_id}`;

        io.to(receiverRoom).emit("editMessage", camelCasedMessage);
        io.to(senderRoom).emit("editMessage", camelCasedMessage);

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
                    attributes: ['id', 'message'],
                    // where: {is_deleted: false},
                }
            ],
            order: [['id', 'DESC']],
            attributes: [
                'id',
                ['sender_id', 'senderId'],
                ['receiver_id', 'receiverId'],
                'message',
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
            limit: 9
        });

        const allMessages = messages.map(msg => msg.toJSON());

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
                isRead: Boolean(msg.isRead),
                isEdited: Boolean(msg.isEdited),
                isDeleted: Boolean(msg.isDeleted),
                temp: false,
                reactions: [],
            })
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

        return successResponse(res, { friendship: friendship?.status, messages: response.reverse() }, "All messages retrieved between the two people");

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