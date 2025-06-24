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
    GroupMembers,
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

        // "Group was created"
        const systemMessage = await GroupMessages.create({
            group_id: group.id,
            sender_id: null,
            message: `Group: ${name} created by ${user.name?.split(' ')[0]}!`,
            type: 'system'
        });
        
        const message = {
            id: systemMessage.id,
            senderId: null,
            message: systemMessage.message,
            createdAt: systemMessage.createdAt,
            type: systemMessage.type,
            sender: {
                name: null,
            }
        };
        
        memberIds.push(user.id);
        const io = req.app.get('io');
        // Emit new group created event to all the members (including self)
        memberIds.map((id) => io.to(`user_${id}`).emit("groupCreated", {group: {id: group.id, name: group.name}}));
        io.to(`group_${group.id}`).emit("newGroupMessage", {message, groupId: group.id});

        await group.addMembers(memberIds); //Magic method

        return successPostResponse(res, {}, "Group generated");
    } catch (error) {
        return errorThrowResponse(res, error.message);
    }
};

const sendGroupMessage = async (req, res) => {
    try {
        const { groupId, msg } = req.body;
        const user = req.user;

        const group = await Groups.findOne({ where: { id: groupId } });
        if (!group) notFoundResponse(res, "Group not found");

        const users = await group.getGroupMembers({where: {status: 'active'}, attributes: ["user_id"] }); //Magic method to get all the group member ids
        let userIds = users.map((curr) => curr.user_id);

        if (!userIds.includes(user.id)) {
            return errorResponse(res, "User is not a part of this group");
        }

        const groupMessage = await GroupMessages.create({
            group_id: groupId,
            sender_id: user.id,
            message: msg,
        });

        userIds = userIds.filter((curr) => {
            if (curr != user.id) return curr;
        });

        const readEntries = userIds.map((id) => ({
            group_message_id: groupMessage.id,
            user_id: id,
        }));
        await GroupMessageRead.bulkCreate(readEntries);

        const message = {
            id: groupMessage.id,
            senderId: user.id,
            message: msg,
            createdAt: groupMessage.createdAt,
            type: 'text',
            sender: {
                name: user.name
            }
        };        
        const io = req.app.get("io");
        io.to(`group_${groupId}`).emit("newGroupMessage", {message, groupId});

        return successPostResponse(res, {}, "Message sent");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

const getGroupData = async (req, res) => {
    try {
        const groupId = req.params.id;
        const user = req.user;

        const group = await Groups.findOne({ where: { id: groupId } });
        if (!group) notFoundResponse(res, "Group not found");

        const users = await group.getGroupMembers({where: {status: 'active'}, attributes: ["user_id"] }); //Magic method to get all the group member ids
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
                        "type"
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

        // Get the group members
        const members = await Groups.findOne({
            where: { id: groupId },
            attributes: ["id", "name"],
            include: [
                {
                    model: User,
                    as: "members",
                    attributes: ["id", "name", "email"],
                    through: { where: {status: 'active'}, attributes: [] },
                },
            ],
        });

        const result = {messages: groupMessages, members}

        return successResponse(res, result, "Fetched all messages");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

// const getGroupMembers = async (req, res) => {
//     try {
//         const groupId = req.params.id;

//         const members = await Groups.findOne({
//             where: { id: groupId },
//             attributes: ["id", "name"],
//             // include: [
//             //     {
//             //         model: GroupMembers,
//             //         as: 'groupMembers',
//             //         attributes: ['id'],
//             //         include: [
//             //             {
//             //                 model: User,
//             //                 as: 'user',
//             //                 attributes: ['id', 'name', 'email']
//             //             }
//             //         ]
//             //     }
//             // ]
//             include: [
//                 {
//                     model: User,
//                     as: "members",
//                     attributes: ["id", "name", "email"],
//                     through: { attributes: [] },
//                 },
//             ],
//         });

//         return successResponse(res, members, "Fetched all members of the group");
//     } catch (error) {
//         return errorThrowResponse(res, `${error.message}`, error);
//     }
// };

const getGroups = async (req, res) => {
    try {
        const user = req.user;
        // const groups = await Groups.findAll({
        //     include: [
        //         {
        //             model: User,
        //             as: "members",
        //             attributes: ["id", "name", "email"],
        //             through: { attributes: [] },
        //         },
        //     ],
        //     where: {
        //         [Op.or]: [
        //             { created_by: user.id },
        //             { '$members.id$': user.id }, // Check if user is a member
        //         ],
        //     },
        // });
        let groups = await GroupMembers.findAll({
            where: {user_id: user.id, status: 'active'},
            attributes: [['group_id','id']],
            include: [
                {
                    model: Groups,
                    as: 'group',
                    attributes: ['name']
                }
            ]
        });

        groups = groups.map((curr) => {
            return ({
                id: curr.id,
                name: curr.group.name
            })
        })

        return successResponse(res, groups, "Fetched all groups");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

const deleteGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const user = req.user;

        const group = await Groups.findOne({ where: { id: groupId } });
        if (!group) notFoundResponse(res, "Group not found");

        const users = await group.getGroupMembers({ attributes: ["user_id"] }); //Magic method to get all the group member id
        let userIds = users.map((curr) => curr.user_id);

        if (!userIds.includes(user.id)) {
            return errorResponse(res, "User is not a part of this group");
        }

        let messageIds = await GroupMessages.findAll({
            where: {group_id: groupId},
            attributes: ['id']
        });

        messageIds = messageIds.map(curr => curr.id);

        await GroupMessageRead.destroy({
            where: {group_message_id: messageIds}
        });

        await GroupMessages.destroy({ where: {group_id: groupId}});
        await GroupMembers.destroy({ where: {group_id: groupId}});
        await Groups.destroy({ where: {id: groupId}});

        return successResponse(res, {}, "Group deleted successfully ")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const leaveGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const user = req.user;

        let groupMessageIds = await GroupMessages.findAll({where: {group_id: groupId}, attributes: ['id']});
        groupMessageIds = groupMessageIds.map(curr => curr.id);

        const partOfGroup = await GroupMembers.findOne({
            where: {
                group_id: groupId,
                user_id: user.id,
                status: 'active'
            }
        });
        if(!partOfGroup) return errorResponse(res, "User is not part of the group!");

        await GroupMembers.update(
            {status: 'left'},
            {where: {group_id: groupId, user_id: user.id}}
        );
        await GroupMessageRead.destroy({where: {user_id: user.id, group_message_id: groupMessageIds}});
        
        const systemMessage = await GroupMessages.create({
            group_id: groupId,
            sender_id: null,
            message: `${user.name?.split(' ')[0]} left the group`,
            type: 'system'
        });

        const message = {
            id: systemMessage.id,
            senderId: null,
            message: systemMessage.message,
            createdAt: systemMessage.createdAt,
            type: systemMessage.type,
            sender: {
                name: null,
            }
        };

        const io = req.app.get('io');
        io.to(`group_${groupId}`).emit("newGroupMessage", {message, groupId});

        return successPostResponse(res, {}, "User left this group successfully")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const joinGroup = async (req, res) => {
    try {
        const {groupId, friendIds} = req.body;
        const user = req.user;

        const partOfGroup = await GroupMembers.findOne({where: {group_id: groupId, user_id: user.id, status: 'active'}});
        if(!partOfGroup) return errorResponse(res, "User not part of the group");
        
        const existingMembers = await GroupMembers.findAll({where: {group_id: groupId, user_id: friendIds}});

        const membersToUpdate = []; // Members that have left
        const activeMembers = [];
        
        // To seperate into active/left members
        existingMembers.forEach( (curr) => {
            if(curr.status === 'left') membersToUpdate.push(curr.user_id);
            else activeMembers.push(curr.user_id);
        });

        // Only the users not part of the group whether active/left
        const membersToCreate = friendIds
        .filter(curr => !membersToUpdate.includes(curr) && !activeMembers.includes(curr))
        .map(curr => {
            return {
                group_id: groupId,
                user_id: curr
            };
        });
        // Database queries
        await GroupMembers.update(
            {status: 'active'},
            {where: {group_id: groupId, user_id: membersToUpdate}}
        );
        
        await GroupMembers.bulkCreate(membersToCreate);

        // For system messages in groups
        const newMemberIds = friendIds.filter((id) => !activeMembers.includes(id));
        const newMembers = await User.findAll({where: {id: newMemberIds}, attributes: ['name']});
        
        const systemMessages = await GroupMessages.bulkCreate(
            newMembers.map((newUser) => ({
                group_id: groupId,
                sender_id: null,
                message: `${user.name?.split(' ')[0]} added ${newUser.name?.split(" ")[0]}`,
                type: 'system',
            }))
        );

        const group = await Groups.findOne({where: {id: groupId}, attributes: ['name']});

        const io = req.app.get('io');
        systemMessages.forEach((msg) => {
            const message = {
                id: msg.id,
                senderId: null,
                message: msg.message,
                createdAt: msg.createdAt,
                type: msg.type,
                sender: {
                    name: null,
                }
            };
            io.to(`group_${groupId}`).emit("newGroupMessage", {message, groupId});
        });

        newMemberIds.forEach((id) => {
            io.to(`user_${id}`).emit("groupJoined", {group: {id: groupId, name: group.name}});
        })

        return successPostResponse(res, {membersToUpdate, activeMembers, membersToCreate, newMemberIds}, "Users successfully joined the group")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

module.exports = {
    createGroup,
    sendGroupMessage,
    getGroupData,
    getGroups,
    deleteGroup,
    leaveGroup,
    joinGroup
};