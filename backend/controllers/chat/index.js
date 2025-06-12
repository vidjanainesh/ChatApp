const { Op, Sequelize } = require("sequelize");
const { Message, User, Friends } = require("../../models");

const sendMessage = async (req, res) => {
    try {
        const { message, receiverId } = req.body;
        const user = req.user;
        // console.log(message, receiverId, user);

        if(!message || !receiverId){
            return res.status(401).json({
                status: "error",
                message: "Message content and Receiver ID are required"
            })
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
            return res.status(400).json({
                message: "Not friends with this user"
            })
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

        io.to(receiverRoom).emit("newMessage", messageWithSender);
        io.to(senderRoom).emit("newMessage", messageWithSender);
        
        return res.status(201).json({
            status: "success",
            message: "Message sent",
            sentMessage
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}

// const getUsers = async (req, res) => {
//     try {
//         const user = req.user;
//         if(user.id === 2){
//             const users = await User.findAll({
//                 where: {
//                     id: {
//                         [Op.ne]: user.id 
//                     }
//                 },
//                 attributes: ['id', 'name', 'email'],  
//             });

//             return res.status(201).json({
//                 status: "success",
//                 message: "Fetched all users",
//                 data: users
//             });
//         }
//         else{
//             const users = await User.findAll({
//                 where: {
//                     id: {
//                         [Op.notIn]: [user.id, 1]
//                     }
//                 },
//                 attributes: ['id', 'name', 'email'],  
//             });

//             return res.status(201).json({
//                 status: "success",
//                 message: "Fetched all users",
//                 data: users
//             });
//         }
        
//     } catch (error) {
//         return res.status(500).json({
//             status: "error",
//             message: error.message
//         });
//     }
// }

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
                // [Op.and]: Sequelize.literal(`NOT EXISTS (
                //     SELECT 1 FROM Friends f
                //     WHERE (
                //         (f.sender_id = ${currentUserId} AND f.receiver_id = User.id) OR
                //         (f.sender_id = User.id AND f.receiver_id = ${currentUserId})
                //     ) AND f.status IN ('pending', 'accepted')
                // )`)
                [Op.and]: Sequelize.literal(`
                    NOT EXISTS (
                        SELECT 1 FROM "Friends" f
                        WHERE (
                        (f.sender_id = ${currentUserId} AND f.receiver_id = "User".id)
                        OR
                        (f.sender_id = "User".id AND f.receiver_id = ${currentUserId})
                        )
                        AND f.status IN ('pending', 'accepted')
                    )
                `)
            },
            attributes: ['id', 'name', 'email']
        });

        return res.status(200).json({
            status: "success",
            message: "Fetched eligible users",
            data: users
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

const getMessages = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;

        if(!id) {
            return res.status(401).json({
                status: "error",
                message: "Person ID is required"
            })
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

        return res.status(201).json({
            status: "success",
            message: "All messages retrieved between the two people",
            data: allMessages
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}

module.exports = {
    sendMessage,
    getMessages,
    getUsers
}