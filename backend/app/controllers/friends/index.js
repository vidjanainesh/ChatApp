const { Op } = require("sequelize");
const { Friends, User } = require("../../models")
const {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
  conflictResponse
} = require("../../helper/response");

const sendFriendReq = async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;

        if (user.id === id) {
            return badRequestResponse(res, "You can't send a friend request to yourself.");
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
            return conflictResponse(res, "Friend request already exists or you are already friends.");
        }
        
        const obj = {
            sender_id: user.id,
            receiver_id: id,
            timestamp: Date.now()
        }

        await Friends.create(obj);

        return successResponse(res, {}, "Friend request sent");

    } catch (error) {
        return errorResponse(res, error.message, 500)
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
            return notFoundResponse(res, "Friend request not found");
        }

        return successResponse(res, {}, "Friend request status updated");
    } catch (error) {
        return errorResponse(res, error.message, 500)
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

        return successResponse(res, result, "Fetched all req")
    } catch (error) {
        console.log("Error: ", error);
        return errorResponse(res, error.message, 500)
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

    const userObj = {
        id: user.id,
        name: user.name,
        email: user.email
    }

    return successResponse(res, {
      user: userObj,
      data: friendList
    }, "Fetched all friends");

  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
    getAllFriendReq,
    sendFriendReq,
    manageFriendReq,
    getFriends
}