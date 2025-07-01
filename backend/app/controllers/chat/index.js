const { Op, Sequelize } = require("sequelize");
const { Message, User, Friends, MessageReactions } = require("../../models");
const {
    successResponse,
    errorResponse,
    unAuthorizedResponse,
    errorThrowResponse,
} = require("../../helper/response");
const sequelize = require("../../models/database");

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
        const user = req.user;
        // console.log(message, receiverId, user);

        if (!message || !receiverId) {
            return unAuthorizedResponse(res, "Message content and Receiver ID are required");
        };

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
            sender_id: user.id,
            receiver_id: receiverId,
            message
        });

        const io = req.app.get("io");
        const receiverRoom = `user_${receiverId}`;
        const senderRoom = `user_${user.id}`;

        const rawMessage = sentMessage.toJSON(); // Convert Sequelize model to plain object
        const camelCasedMessage = toCamelCase(rawMessage); // Convert keys to camelCase

        // Add sender_name to the emitted message
        const messageWithSender = {
            ...camelCasedMessage,
            isDeleted: false,
            isEdited: false,
            isRead: false,
            reactions: [],
            senderName: user.name || user.email || "Unknown",
        };

        const payload = {
            message: messageWithSender,
        };

        io.to(receiverRoom).emit("newMessage", payload);
        io.to(senderRoom).emit("newMessage", payload);

        return successResponse(res, sentMessage, "Message sent");
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
            where: {target_id: id, target_type: 'private'}
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
        if(!message) return errorResponse(res, 'Invalid Message')

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

const getUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const baseExclusions = [currentUserId];
        if (currentUserId !== 2) {
            baseExclusions.push(1);
        }

        const users = await sequelize.query(`
            SELECT u.id, u.name, u.email
            FROM users u
            WHERE u.id NOT IN (:excludedIds)
            AND NOT EXISTS (
                SELECT 1 FROM friends f
                WHERE (
                    (f.sender_id = :currentUserId AND f.receiver_id = u.id)
                    OR
                    (f.sender_id = u.id AND f.receiver_id = :currentUserId)
                )
                AND f.status IN ('pending', 'accepted')
            )
        `, {
            replacements: {
                excludedIds: baseExclusions,
                currentUserId
            },
            type: Sequelize.QueryTypes.SELECT
        });

        return successResponse(res, users, "Fetched eligible users");

    } catch (error) {
        // console.error(error);
        return errorThrowResponse(res, error.message, error);
    }
};

const getMessages = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;

        if (!id) {
            return unAuthorizedResponse(res, "Person ID is required");
        }
        const allMessages = await Message.findAll({
            where: {
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
            },
            order: [['createdAt', 'ASC']],
            attributes: [
                'id',
                ['sender_id', 'senderId'],
                ['receiver_id', 'receiverId'],
                'message',
                ['is_read', 'isRead'],
                ['is_deleted', 'isDeleted'],
                ['is_edited', 'isEdited'],
                'createdAt',
                'updatedAt'
            ],
            raw: true,
        });

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
        const response = allMessages.map((msg) => {
            const newMsg = ({
                ...msg,
                reactions: [],
            })
            messageReactions.map((reaction) => {
                if (msg.id === reaction.messageId) newMsg.reactions.push(reaction);
            });
            return newMsg;
        })

        // Update is_read to true
        await Message.update(
            { is_read: true },
            {
                where: {
                    sender_id: id,
                    receiver_id: user.id,
                    is_read: false,
                },
            }
        );

        return successResponse(res, response, "All messages retrieved between the two people");

    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

module.exports = {
    sendMessage,
    deleteMessage,
    editMessage,
    getMessages,
    getUsers,
}