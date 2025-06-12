const { Op } = require("sequelize");
const { Friends, User } = require("../../models")

const sendFriendReq = async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;

        if (user.id === id) {
            return res.status(400).json({ status: "error", message: "You can't send a friend request to yourself." });
        }

        const existing = await Friends.findOne({
            where: {
                [Op.or]: [
                    { sender_id: user.id, receiver_id: id },
                    { sender_id: id, receiver_id: user.id }
                ],
                status: { [Op.in]: ['pending', 'accepted'] }
            }
        });

        if (existing) {
            return res.status(409).json({
                status: "error",
                message: "Friend request already exists or you are already friends."
            });
        }
        
        const obj = {
            sender_id: user.id,
            receiver_id: id,
            timestamp: Date.now()
        }

        await Friends.create(obj);

        return res.status(200).json({
            status: "success",
            message: "Friend request sent"
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: `${error}`
        })
    }
}

const manageFriendReq = async (req, res) => {
    try {
        let { id, status } = req.body;
        const user = req.user;

        // status = status == '1' ? 'accepted' : 'rejected';

        const result = await Friends.update(
            { status },
            { where: {
                sender_id: id,
                receiver_id: user.id
            }}
        )

        if(result[0] === 0) {
            return res.status(404).json({
                status: "error",
                message: "Friend request not found"
            })
        }

        return res.status(200).json({
            status: "success",
            message: "Friend request status updated"
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        })
    }
}

const getAllFriendReq = async (req, res) => {
    try {
        const user = req.user;

        const result = await Friends.findAll({
            where: {
                receiver_id: user.id,
                status: 'pending'
            },
            include: [
                {
                    model: User,
                    attributes: ['name', 'email'],
                    as: 'sender'
                }
            ],
            attributes: [
                ['sender_id', 'senderId']
            ]
        });

        return res.status(200).json({
            status: "success",
            message: "Fetched all req",
            data: result
        })
    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({
            status: "error",
            message: error.message
        })
    }
}

const getFriends = async (req, res) => {
  try {
    const user = req.user;

    const friends = await Friends.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { sender_id: user.id },
          { receiver_id: user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: ['id', 'sender_id', 'receiver_id', 'status']
    });

    // console.log(friends[0].receiver);

    const friendList = friends.map(friend => {
      const isSender = friend.sender_id === user.id;
      const otherUser = isSender ? friend.receiver : friend.sender;
      return {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Fetched all friends",
      data: friendList
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

module.exports = {
    getAllFriendReq,
    sendFriendReq,
    manageFriendReq,
    getFriends
}