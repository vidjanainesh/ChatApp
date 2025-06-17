const { Op, Sequelize } = require("sequelize");
const { Message, User, Friends } = require("../../models");
const {
  successResponse,
  errorResponse,
  unAuthorizedResponse,
  badRequestResponse
} = require("../../helper/response");

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
            return badRequestResponse(res, "Not friends with this user");
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
            fromUserId: user.id
        };

        io.to(receiverRoom).emit("newMessage", payload);
        io.to(senderRoom).emit("newMessage", payload);
        
        return successResponse(res, sentMessage, "Message sent");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

const getUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const baseExclusions = [currentUserId];
        if (currentUserId !== 2) {
            baseExclusions.push(1); 
        }

        const users = await User.findAll({
            where: {
                id: {
                    [Op.notIn]: baseExclusions
                },
                // For local mySQL
                [Op.and]: Sequelize.literal(`NOT EXISTS (
                    SELECT 1 FROM Friends f
                    WHERE (
                        (f.sender_id = ${currentUserId} AND f.receiver_id = User.id) OR
                        (f.sender_id = User.id AND f.receiver_id = ${currentUserId})
                    ) AND f.status IN ('pending', 'accepted')
                )`)

                // For deployed postgreSQL
                // [Op.and]: Sequelize.literal(`
                //     NOT EXISTS (
                //         SELECT 1 FROM "Friends" f
                //         WHERE (
                //         (f.sender_id = ${currentUserId} AND f.receiver_id = "User".id)
                //         OR
                //         (f.sender_id = "User".id AND f.receiver_id = ${currentUserId})
                //         )
                //         AND f.status IN ('pending', 'accepted')
                //     )
                // `)
            },
            attributes: ['id', 'name', 'email']
        });
        return successResponse(res, users, "Fetched eligible users");

    } catch (error) {
        // console.error(error);
        return errorResponse(res, error.message, 500);
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
        return errorResponse(res, error.message, 500);
    }
}

const getUnreadMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const unreadCounts = await Message.findAll({
            where: {
                receiver_id: userId,
                is_read: false
            },
            attributes: [
                'sender_id',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'unreadCount']
            ],
            group: ['sender_id']
        });

        const unreadMap = {};
        unreadCounts.forEach(row => {
            unreadMap[row.sender_id] = parseInt(row.get('unreadCount'));
        });

        return successResponse(res, unreadMap);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

module.exports = {
    sendMessage,
    getMessages,
    getUsers,
    getUnreadMessages
}