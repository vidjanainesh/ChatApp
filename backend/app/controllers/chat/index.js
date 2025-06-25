const { Op, Sequelize } = require("sequelize");
const { Message, User, Friends } = require("../../models");
const {
  successResponse,
  errorResponse,
  unAuthorizedResponse,
  errorThrowResponse,
} = require("../../helper/response");
const sequelize = require("../../models/database");

const sendMessage = async (req, res) => {
    try {
        const { message, receiverId } = req.body;
        const user = req.user;
        // console.log(message, receiverId, user);

        if(!message || !receiverId){
            return unAuthorizedResponse(res, "Message content and Receiver ID are required");
        };

        const friendship = await Friends.findOne({
            where: {
                status: "accepted",
                [Op.or] : [
                    {sender_id: user.id, receiver_id: receiverId},
                    {sender_id: receiverId, receiver_id: user.id}
                ]
            }
        });

        if(!friendship) {
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

        // Add sender_name to the emitted message
        const messageWithSender = {
            ...sentMessage.toJSON(),
            sender_name: user.name || user.email || "Unknown",
        };

        const payload = {
            message: messageWithSender, 
        };

        io.to(receiverRoom).emit("newMessage", payload);
        io.to(senderRoom).emit("newMessage", payload);
        
        return successResponse(res, sentMessage, "Message sent");
    } catch (error) {
        return errorThrowResponse(res, error.message, 500);
    }
}

const deleteMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;

        const message = await Message.findOne({where: {id}});

        if(message.sender_id !== user.id){
            return errorResponse(res, 'Invalid user');
        }

        message.is_deleted = true;
        await message.save();

        const io = req.app.get("io");
        const receiverRoom = `user_${message.receiver_id}`;
        const senderRoom = `user_${message.sender_id}`;

        io.to(receiverRoom).emit("deleteMessage", message);
        io.to(senderRoom).emit("deleteMessage", message);

        return successResponse(res, message, "Message deleted successfully")
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const editMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const {msg} = req.body;
        const user = req.user;

        const message = await Message.findOne({where: {id}});

        if(message.sender_id !== user.id) {
            return errorResponse(res, 'Invalid user');
        }

        message.message = msg;
        message.is_edited = true;
        message.updatedAt = new Date();
        await message.save();

        const io = req.app.get("io");
        const receiverRoom = `user_${message.receiver_id}`;
        const senderRoom = `user_${message.sender_id}`;

        io.to(receiverRoom).emit("editMessage", message);
        io.to(senderRoom).emit("editMessage", message);

        return successResponse(res, message, "Message edited successfully");
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
        return errorThrowResponse(res, error.message, 500);
    }
};

const getMessages = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;

        if(!id) {
            return unAuthorizedResponse(res, "Person ID is required");
        }
        const allMessages = await Message.findAll({
            where: {
                is_deleted: false,
                [Op.or] : [
                    {
                        [Op.and] : [
                            {sender_id: user.id},
                            {receiver_id: id}
                        ]
                    },
                    {
                        [Op.and] : [
                            {sender_id: id},
                            {receiver_id: user.id}
                        ]
                    }
                ]
            },
            order: [['timestamp', 'ASC']]
        });

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

        return successResponse(res, allMessages, "All messages retrieved between the two people");

    } catch (error) {
        return errorThrowResponse(res, error.message, 500);
    }
}

module.exports = {
    sendMessage,
    deleteMessage,
    editMessage,
    getMessages,
    getUsers,
}