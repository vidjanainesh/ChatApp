const { Op } = require("sequelize");
const {
    successPostResponse,
    errorThrowResponse,
    notFoundResponse,
    errorResponse,
    successResponse,
    unAuthorizedResponse,
} = require("../../helper/response");
const {
    Friends,
    Groups,
    GroupMessages,
    User,
    GroupMessageRead,
    GroupMembers,
    MessageReactions,
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
        memberIds.map((id) => io.to(`user_${id}`).emit("groupCreated", { group: { id: group.id, name: group.name } }));
        io.to(`group_${group.id}`).emit("newGroupMessage", { message, groupId: group.id });

        await group.addMembers(memberIds); //Magic method

        return successPostResponse(res, {}, "Group generated");
    } catch (error) {
        return errorThrowResponse(res, error.message);
    }
};

const sendGroupMessage = async (req, res) => {
    try {
        const { groupId, msg } = req.body;
        const replyTo = req.body.replyTo || null;
        const user = req.user;
        const file = req.file;

        let fileUrl = null;
        // let fileBlurUrl = null;
        let fileType = null;
        let fileName = null;
        let fileSize = null;

        if (!msg && !file) {
            return unAuthorizedResponse(res, "Message content or File is required");
        };

        const group = await Groups.findOne({ where: { id: groupId } });
        if (!group) notFoundResponse(res, "Group not found");

        const users = await group.getGroupMembers({ where: { status: 'active' }, attributes: ["user_id"] }); //Magic method to get all the group member ids
        let userIds = users.map((curr) => curr.user_id);

        if (!userIds.includes(user.id)) {
            return errorResponse(res, "User is not a part of this group");
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

        const groupMessage = await GroupMessages.create({
            group_id: groupId,
            sender_id: user.id,
            message: msg,
            reply_to: replyTo,
            file_url: fileUrl,
            file_type: fileType,
            file_name: fileName,
            file_size: fileSize,
            // file_blur_url: fileBlurUrl
        });

        userIds = userIds.filter((curr) => {
            if (curr != user.id) return curr;
        });

        const readEntries = userIds.map((id) => ({
            group_message_id: groupMessage.id,
            user_id: id,
        }));
        let readIds = await GroupMessageRead.bulkCreate(readEntries);
        readIds = readIds.map(read => read.id);

        const reads = await GroupMessageRead.findAll({
            where: { id: readIds },
            attributes: [
                'id',
                ['user_id', 'userId'],
                ['read_at', 'readAt'],
            ],
            include: [
                {
                    model: User,
                    as: 'reader',
                    attributes: ['name']
                }
            ]

        })

        const repliedMessage = await GroupMessages.findOne({
            where: { id: replyTo },
            attributes: ['id', 'message'],
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name'],
                }
            ]
        });

        const message = {
            id: groupMessage.id,
            senderId: user.id,
            message: msg,
            createdAt: groupMessage.createdAt,
            type: 'text',
            fileUrl: groupMessage.file_url,
            fileType: groupMessage.file_type,
            fileName: groupMessage.file_name,
            fileSize: groupMessage.file_size,
            fileBlurUrl: groupMessage.file_blur_url,
            isDeleted: false,
            isEdited: false,
            sender: {
                name: user.name
            },
            reactions: [],
            repliedMessage,
            reads,
        };
        const io = req.app.get("io");
        io.to(`group_${groupId}`).emit("newGroupMessage", { message, groupId, groupName: group.name });

        return successPostResponse(res, {}, "Message sent");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

const deleteGroupMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;

        const groupMessage = await GroupMessages.findOne({ where: { id } });

        if (groupMessage.sender_id !== user.id) {
            return errorResponse(res, 'Invalid user');
        }

        groupMessage.is_deleted = true;
        await groupMessage.save();

        await GroupMessageRead.destroy({
            where: { group_message_id: id }
        });

        const message = {
            id: groupMessage.id,
            senderId: user.id,
            message: groupMessage.message,
            createdAt: groupMessage.createdAt,
            type: groupMessage.type,
            isDeleted: groupMessage.is_deleted,
            isEdited: groupMessage.is_edited,
            sender: {
                name: user.name
            }
        };

        const io = req.app.get("io");
        io.to(`group_${groupMessage.group_id}`).emit("deleteGroupMessage", { message, groupId: groupMessage.group_id });

        return successResponse(res, message, "Group Message deleted successfully")
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const editGroupMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const { msg } = req.body;
        const user = req.user;

        const groupMessage = await GroupMessages.findOne({ where: { id } });

        if (groupMessage.sender_id !== user.id) {
            return errorResponse(res, 'Invalid user');
        }

        groupMessage.message = msg;
        groupMessage.is_edited = true;
        groupMessage.updatedAt = new Date();
        await groupMessage.save();

        const message = {
            id: groupMessage.id,
            senderId: user.id,
            message: groupMessage.message,
            createdAt: groupMessage.createdAt,
            type: groupMessage.type,
            isDeleted: groupMessage.is_deleted,
            isEdited: groupMessage.is_edited,
            sender: {
                name: user.name
            }
        };

        const io = req.app.get("io");
        io.to(`group_${groupMessage.group_id}`).emit("editGroupMessage", { message, groupId: groupMessage.group_id });

        return successResponse(res, message, "Message edited successfully");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const getGroupData = async (req, res) => {
    try {
        const groupId = req.params.id;
        const user = req.user;
        const beforeMessageId = req.query.beforeMessageId;

        const group = await Groups.findOne({ where: { id: groupId } });
        if (!group) notFoundResponse(res, "Group not found");

        const users = await group.getGroupMembers({ where: { status: 'active' }, attributes: ["user_id"] }); //Magic method to get all the group member ids
        let userIds = users.map((curr) => curr.user_id);

        if (!userIds.includes(user.id)) {
            return errorResponse(res, "User is not a part of this group");
        }

        const gmWhereClause = {
            is_deleted: false,
            group_id: groupId,
        }

        if (beforeMessageId) {
            gmWhereClause.id = { [Op.lt]: beforeMessageId }
        }

        const groupMessages = await GroupMessages.findAll({
            where: gmWhereClause,
            attributes: [
                "id",
                ["sender_id", "senderId"],
                "message",
                ['file_url', 'fileUrl'],
                ['file_type', 'fileType'],
                ['file_name', 'fileName'],
                ['file_size', 'fileSize'],
                ['file_blur_url', 'fileBlurUrl'],
                ["is_deleted", "isDeleted"],
                ["is_edited", "isEdited"],
                "type",
                "createdAt",
            ],
            limit: 9,
            order: [['id', 'DESC']],
            include: [


                {
                    model: User,
                    as: "sender",
                    attributes: ["name"],
                },
                {
                    model: GroupMessages,
                    as: 'repliedMessage',
                    attributes: ['id', 'message'],
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['id', 'name'],
                        }
                    ]
                },
                {
                    model: GroupMessageRead,
                    as: 'reads',
                    attributes: [
                        'id',
                        ['user_id', 'userId'],
                        ['read_at', 'readAt'],
                    ],
                    include: [
                        {
                            model: User,
                            as: 'reader',
                            attributes: ['name']
                        }
                    ]
                }


            ],
        });

        const plainGroupMessages = groupMessages.map(msg => msg.toJSON());

        // Get group messages' ids
        const groupMessageIds = plainGroupMessages.map((curr) => curr.id);

        // // Update read status
        // await GroupMessageRead.update(
        //     { read_at: new Date() },
        //     {
        //         where: {
        //             group_message_id: groupMessageIds,
        //             user_id: user.id,
        //         },
        //     }
        // );

        // Get the reactions
        let messageReactions = await MessageReactions.findAll({
            where: { target_type: 'group', target_id: groupMessageIds },
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
        ));

        const messagesWithReactions = plainGroupMessages.map((msg) => {
            const newMsg = ({
                ...msg,
                reactions: [],
            })
            messageReactions.map((reaction) => {
                if (msg.id === reaction.messageId) newMsg.reactions.push(reaction);
            });
            return newMsg;
        })

        // Get the group members
        const members = await Groups.findOne({
            where: { id: groupId },
            attributes: ["id", "name"],
            include: [
                {
                    model: User,
                    as: "members",
                    attributes: ["id", "name", "email"],
                    through: { where: { status: 'active' }, attributes: [] },
                },
            ],
        });

        const plainMembers = members.toJSON();

        const result = { messages: messagesWithReactions.reverse(), members: plainMembers }

        return successResponse(res, result, "Fetched all messages");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

const getGroups = async (req, res) => {
    try {
        const user = req.user;
        let groups = await GroupMembers.findAll({
            where: { user_id: user.id, status: 'active' },
            attributes: [['group_id', 'id']],
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
            where: { group_id: groupId },
            attributes: ['id']
        });

        messageIds = messageIds.map(curr => curr.id);

        await GroupMessageRead.destroy({
            where: { group_message_id: messageIds }
        });

        await GroupMessages.destroy({ where: { group_id: groupId } });
        await GroupMembers.destroy({ where: { group_id: groupId } });
        await Groups.destroy({ where: { id: groupId } });

        return successResponse(res, {}, "Group deleted successfully ")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const leaveGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const user = req.user;

        let groupMessageIds = await GroupMessages.findAll({ where: { group_id: groupId }, attributes: ['id'] });
        groupMessageIds = groupMessageIds.map(curr => curr.id);

        const partOfGroup = await GroupMembers.findOne({
            where: {
                group_id: groupId,
                user_id: user.id,
                status: 'active'
            }
        });
        if (!partOfGroup) return errorResponse(res, "User is not part of the group!");

        await GroupMembers.update(
            { status: 'left' },
            { where: { group_id: groupId, user_id: user.id } }
        );
        await GroupMessageRead.destroy({ where: { user_id: user.id, group_message_id: groupMessageIds } });

        const systemMessage = await GroupMessages.create({
            group_id: groupId,
            sender_id: null,
            message: `${user.name?.split(' ')[0]} left the group`,
            type: 'system',
        });

        const message = {
            id: systemMessage.id,
            senderId: null,
            message: systemMessage.message,
            createdAt: systemMessage.createdAt,
            type: systemMessage.type,
            sender: {
                name: null,
            },
        };

        const io = req.app.get('io');
        io.to(`group_${groupId}`).emit("newGroupMessage", { message, groupId });

        return successPostResponse(res, {}, "User left this group successfully")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const joinGroup = async (req, res) => {
    try {
        const { groupId, friendIds } = req.body;
        const user = req.user;

        const partOfGroup = await GroupMembers.findOne({ where: { group_id: groupId, user_id: user.id, status: 'active' } });
        if (!partOfGroup) return errorResponse(res, "User not part of the group");

        const existingMembers = await GroupMembers.findAll({ where: { group_id: groupId, user_id: friendIds } });

        const membersToUpdate = []; // Members that have left
        const activeMembers = [];

        // To seperate into active/left members
        existingMembers.forEach((curr) => {
            if (curr.status === 'left') membersToUpdate.push(curr.user_id);
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
            { status: 'active' },
            { where: { group_id: groupId, user_id: membersToUpdate } }
        );

        await GroupMembers.bulkCreate(membersToCreate);

        // For system messages in groups
        const newMemberIds = friendIds.filter((id) => !activeMembers.includes(id));
        const newMembers = await User.findAll({ where: { id: newMemberIds }, attributes: ['name'] });

        const systemMessages = await GroupMessages.bulkCreate(
            newMembers.map((newUser) => ({
                group_id: groupId,
                sender_id: null,
                message: `${user.name?.split(' ')[0]} added ${newUser.name?.split(" ")[0]}`,
                type: 'system',
            }))
        );

        const group = await Groups.findOne({ where: { id: groupId }, attributes: ['name'] });

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
                },
            };
            io.to(`group_${groupId}`).emit("newGroupMessage", { message, groupId });
        });

        newMemberIds.forEach((id) => {
            io.to(`user_${id}`).emit("groupJoined", { group: { id: groupId, name: group.name } });
        })

        return successPostResponse(res, {}, "Users successfully joined the group")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

module.exports = {
    createGroup,
    sendGroupMessage,
    deleteGroupMessage,
    editGroupMessage,
    getGroupData,
    getGroups,
    deleteGroup,
    leaveGroup,
    joinGroup
};