const { Op } = require("sequelize");
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
        
        const sentMessage = await Message.create({
            sender_id: user.id,
            receiver_id: receiverId,
            message
        });

        const io = req.app.get('io');
        io.emit('newMessage', sentMessage.toJSON());

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
//         console.log(user);
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
        const user = req.user;

        const friendships = await Friends.findAll({
            where: {
                status: true,
                [Op.or]: [
                    { sender_id: user.id },
                    { receiver_id: user.id }
                ]
            }
        });

        // Extract friend user IDs (the ones that are NOT the current user)
        const friendIds = friendships.map(f => 
            f.sender_id === user.id ? f.receiver_id : f.sender_id
        );

        // Fetch those users
        const users = await User.findAll({
            where: {
                id: {
                    [Op.in]: friendIds
                }
            },
            attributes: ['id', 'name', 'email']
        });

        return res.status(201).json({
            status: "success",
            message: "Fetched all users",
            data: users
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}

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