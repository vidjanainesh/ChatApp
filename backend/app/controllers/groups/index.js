const { Op } = require("sequelize");
const {
    successPostResponse,
    errorThrowResponse,
    notFoundResponse,
    errorResponse,
    successResponse,
} = require("../../helper/response");
const {
    Friends,
    Groups,
    GroupMessages,
    User,
    GroupMessageRead,
} = require("../../models");

const createGroup = async (req, res) => {
    try {
        const { name, memberIds } = req.body;
        const user = req.user;

        const friends = await Friends.findAll({
            where: {
                status: "accepted",
                [Op.or]: [{ sender_id: user.id }, { receiver_id: user.id }],
            },
            attributes: ["sender_id", "receiver_id"],
        });
        const friendIds = friends.map((curr) => {
            if (curr.sender_id === user.id) return curr.receiver_id;
            else return curr.sender_id;
        });
        // console.log(friendIds);
        for (const id of memberIds) {
            if (!friendIds.includes(id)) {
                return notFoundResponse(res, "Not a friend");
            }
        }

        const group = await Groups.create({
            name,
            created_by: user.id,
        });

        memberIds.push(user.id);
        await group.addMembers(memberIds); //Magic method

        return successPostResponse(res, {}, "Group generated");
    } catch (error) {
        return errorThrowResponse(res, error.message);
    }
};

const sendGroupMessage = async (req, res) => {
    try {
        const { groupId, message } = req.body;
        const user = req.user;

        const group = await Groups.findOne({ where: { id: groupId } });
        if (!group) notFoundResponse(res, "Group not found");
        const users = await group.getGroupMembers({ attributes: ["user_id"] }); //Magic method to get all the group member ids

        let userIds = users.map((curr) => curr.user_id);

        if (!userIds.includes(user.id)) {
            return errorResponse(res, "User is not a part of this group");
        }

        const groupMessage = await GroupMessages.create({
            group_id: groupId,
            sender_id: user.id,
            message,
        });

        userIds = userIds.filter((curr) => {
            if (curr != user.id) return curr;
        });

        const readEntries = userIds.map((id) => ({
            group_message_id: groupMessage.id,
            user_id: id,
        }));
        await GroupMessageRead.bulkCreate(readEntries);

        const io = req.app.get("io");
        io.to(`group_${groupId}`).emit("newGroupMessage", {
            id: groupMessage.id,
            groupId,
            senderId: user.id,
            message,
            createdAt: groupMessage.createdAt,
        });

        return successPostResponse(res, {}, "Message sent");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

const getGroupMessages = async (req, res) => {
    try {
        const groupId = req.params.id;
        const user = req.user;

        const group = await Groups.findOne({ where: { id: groupId } });
        const users = await group.getGroupMembers({ attributes: ["user_id"] }); //Magic method to get all the group member ids

        let userIds = users.map((curr) => curr.user_id);

        if (!userIds.includes(user.id)) {
            return errorResponse(res, "User is not a part of this group");
        }

        const groupMessages = await Groups.findOne({
            where: { id: groupId },
            attributes: ["id", "name"],
            include: [
                {
                    model: GroupMessages,
                    as: "messages",
                    attributes: [
                        "id",
                        ["sender_id", "senderId"],
                        "message",
                        "createdAt",
                    ],
                    include: [
                        {
                            model: User,
                            as: "sender",
                            attributes: ["name"],
                        },
                    ],
                },
            ],
        });

        // Get group messages' ids to update read status
        const groupMessageIds = groupMessages.messages.map((curr) => curr.id);

        await GroupMessageRead.update(
            { read_at: new Date() },
            {
                where: {
                    group_message_id: groupMessageIds,
                    user_id: user.id,
                },
            }
        );

        return successResponse(res, groupMessages, "Fetched all messages");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

const getGroupMembers = async (req, res) => {
    try {
        const groupId = req.params.id;

        const members = await Groups.findOne({
            where: { id: groupId },
            attributes: ["id", "name"],
            // include: [
            //     {
            //         model: GroupMembers,
            //         as: 'groupMembers',
            //         attributes: ['id'],
            //         include: [
            //             {
            //                 model: User,
            //                 as: 'user',
            //                 attributes: ['id', 'name', 'email']
            //             }
            //         ]
            //     }
            // ]
            include: [
                {
                    model: User,
                    as: "members",
                    attributes: ["id", "name", "email"],
                    through: { attributes: [] },
                },
            ],
        });

        return successResponse(res, members, "Fetched all members of the group");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

const getUnreadGroupMessages = async (req, res) => {
  try {
    const user = req.user;

    // Get all messages that are unread (read_at is null) for this user
    const unread = await GroupMessageRead.findAll({
      where: {
        user_id: user.id,
        read_at: null,
      },
      attributes: ["group_message_id"],
      include: [
        {
          model: GroupMessages,
          attributes: ["group_id"],
        },
      ],
    });

    const unreadGroupMap = {};
    unread.forEach((entry) => {
      const groupId = entry.GroupMessage?.group_id;
      if (groupId) {
        unreadGroupMap[groupId] = true;
      }
    });

    return successResponse(res, unreadGroupMap, "Fetched unread group messages");
  } catch (error) {
    return errorThrowResponse(res, `${error.message}`, error);
  }
};

const getGroups = async (req, res) => {
    try {
        const user = req.user;

        const groups = await Groups.findAll({
            include: [
                {
                    model: User,
                    as: "members",
                    attributes: ["id", "name", "email"],
                    through: { attributes: [] },
                },
            ],
            where: {
                [Op.or]: [
                    { created_by: user.id },
                    { '$members.id$': user.id }, // Check if user is a member
                ],
            },
        });

        return successResponse(res, groups, "Fetched all groups");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}


module.exports = {
    createGroup,
    sendGroupMessage,
    getGroupMessages,
    getGroupMembers,
    getUnreadGroupMessages,
    getGroups
};
