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
const { encryptMessage, decryptMessage } = require("../../helper/encryption");

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
            super_admin: user.id,
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
        memberIds.map((id) => io.to(`user_${id}`).emit("groupCreated", { userId: user.id, group: { id: group.id, name: group.name } }));
        io.to(`group_${group.id}`).emit("newGroupMessage", { message, groupId: group.id });

        await group.addMembers(memberIds); //Magic method

        return successPostResponse(res, { group: { id: group.id, name: group.name } }, "Group generated");
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

        let encryptedData, iv;
        if (msg) {
            const encryption = encryptMessage(msg);
            encryptedData = encryption.encryptedData;
            iv = encryption.iv;
        }

        const groupMessage = await GroupMessages.create({
            group_id: groupId,
            sender_id: user.id,
            message: encryptedData,
            iv,
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

        let repliedMessage = await GroupMessages.findOne({
            where: { id: replyTo },
            attributes: ['id', 'message', 'iv'],
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name'],
                }
            ]
        });

        let decryptedMessage;
        if (repliedMessage) {
            decryptedMessage = decryptMessage(repliedMessage.message, repliedMessage.iv);
            repliedMessage = repliedMessage.get({ plain: true });
            delete repliedMessage.iv;
        }

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
            repliedMessage: repliedMessage ? {
                ...repliedMessage,
                message: decryptedMessage
            } : null,
            reads,
            temp: false,
        };

        const io = req.app.get("io");
        io.to(`group_${groupId}`).emit("newGroupMessage", { message, groupId, groupName: group.name });

        return successPostResponse(res, { message, groupId, groupName: group.name }, "Message sent");
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
            message: decryptMessage(groupMessage.message, groupMessage.iv),
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

        const { encryptedData, iv } = encryptMessage(msg);

        groupMessage.message = encryptedData;
        groupMessage.iv = iv;
        groupMessage.is_edited = true;
        groupMessage.updatedAt = new Date();
        await groupMessage.save();

        const message = {
            id: groupMessage.id,
            senderId: user.id,
            message: msg,
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

        const groupObj = {
            id: group.id,
            name: group.name,
            superAdmin: group.super_admin,
            admin: group.admin,
            groupImageUrl: group.group_image_url,
        }
        const superAdmin = group.super_admin;
        const admin = group.admin;

        const users = await group.getGroupMembers({ where: { status: 'active' }, attributes: ["user_id"] }); //Magic method to get all the group member ids
        let userIds = users.map((curr) => curr.user_id);

        if (!userIds.includes(user.id)) {
            return errorResponse(res, "User is not a part of this group");
        }

        // Get the group messages
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
                'message',
                'iv',
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
                    attributes: ["name", ["profile_image_url", "profileImageUrl"]],
                },
                {
                    model: GroupMessages,
                    as: 'repliedMessage',
                    attributes: ['id', 'message', 'iv'],
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

            // To decrypt replied message and remove iv field
            let repliedMessage;
            if (msg.repliedMessage) {
                repliedMessage = {
                    ...msg.repliedMessage,
                    message: decryptMessage(msg.repliedMessage.message, msg.repliedMessage.iv)
                }
                delete repliedMessage.iv;
            }

            // Message object that will be returned for the final message array
            const newMsg = ({
                ...msg,
                message: decryptMessage(msg.message, msg.iv),
                temp: false,
                isDeleted: Boolean(msg.isDeleted),
                isEdited: Boolean(msg.isEdited),
                reactions: [],
                repliedMessage,
            });
            delete newMsg.iv;
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
                    attributes: ["id", "name", "email", ["profile_image_url", "profileImageUrl"]],
                    through: { where: { status: 'active' }, attributes: [] },
                },
            ],
        });

        // Find friends that are not members
        let nonMemberFriends = [];
        if (superAdmin === user.id || admin === user.id) {
            let memberIds = members.members.map((mem) => mem.id);

            const friends = await Friends.findAll({
                where: {
                    status: 'accepted',
                    [Op.or]: [
                        { sender_id: user.id },
                        { receiver_id: user.id },
                    ]
                }
            });

            let friendIds = friends.map((frnd) => {
                let id;
                if (frnd.receiver_id === user.id) id = frnd.sender_id;
                else id = frnd.receiver_id;
                return id;
            });

            const inviteFriendIds = [];
            friendIds.map((id) => {
                if (!memberIds.includes(id)) inviteFriendIds.push(id);
            });

            // console.log(inviteFriendIds);
            nonMemberFriends = await User.findAll({
                where: {
                    id: inviteFriendIds
                },
                attributes: ['id', 'name', 'email', ["profile_image_url", "profileImageUrl"]],
                raw: true
            });
        }


        const result = { group: groupObj, messages: messagesWithReactions.reverse(), members: members.toJSON(), nonMemberFriends }

        return successResponse(res, result, "Fetched group data");
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
                    attributes: ['name', 'super_admin', 'admin']
                }
            ],
        });

        groups = groups.map((curr) => {
            curr = curr.toJSON();
            return ({
                id: curr.id,
                name: curr.group.name,
                superAdmin: curr.group.super_admin,
                admin: curr.group.admin,
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

        const group = await Groups.findOne({
            where: {
                id: groupId,
            },
            attributes: [
                'id',
                'name',
                ['super_admin', 'superAdmin'],
                'admin'
            ]
        });
        if (group.superAdmin === user.id) return errorResponse(res, "Super Admin cannot leave the group");

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

        // Update admin to null if admin left
        if (user.id === group.admin) {
            await Groups.update({ admin: null }, { where: { id: groupId } })
        }

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
        io.to(`group_${groupId}`).emit("newGroupMessage", { message, groupId, groupName: group.name });

        return successPostResponse(res, {}, "User left this group successfully")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const inviteToGroup = async (req, res) => {
    try {
        const { groupId, friendIds } = req.body;
        const user = req.user;

        const partOfGroup = await GroupMembers.findOne({ where: { group_id: groupId, user_id: user.id, status: 'active' } });
        if (!partOfGroup) return errorResponse(res, "User not part of the group");

        const group = await Groups.findOne({
            where: {
                id: groupId,
            },
            attributes: [
                'id',
                'name',
                ['super_admin', 'superAdmin'],
                'admin'
            ]
        });
        if (group.superAdmin === user.id || group.admin === user.id) return errorResponse(res, "Only super admin or admin can invite others");

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
        const newMembers = await User.findAll({ where: { id: newMemberIds }, attributes: ['id', 'name', 'email', ['profile_image_url', 'profileImageUrl']] });

        const systemMessages = await GroupMessages.bulkCreate(
            newMembers.map((newUser) => ({
                group_id: groupId,
                sender_id: null,
                message: `${user.name?.split(' ')[0]} added ${newUser.name?.split(" ")[0]}`,
                type: 'system',
            }))
        );

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
            io.to(`group_${groupId}`).emit("newGroupMessage", { message, groupId, groupName: group.name });
        });

        newMemberIds.forEach((id) => {
            io.to(`user_${id}`).emit("groupJoined", { group: { id: groupId, name: group.name } });
        });

        return successPostResponse(res, newMembers, "Users successfully joined the group")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const removeFromGroup = async (req, res) => {
    try {
        const { memberId } = req.body;
        const groupId = req.params.id;
        const user = req.user;

        const group = await Groups.findOne({
            where: {
                id: groupId,
            },
            attributes: [
                'id',
                'name',
                ['super_admin', 'superAdmin'],
                'admin'
            ],
            raw: true,
        });

        if (group.superAdmin !== user.id && group.admin !== user.id) return errorResponse(res, "Only super admin or admin can remove members");
        if (memberId === group.admin && user.id !== group.superAdmin) return errorResponse("Only super admin can remove the admin");

        const userPartOfGroup = await GroupMembers.findOne({ where: { group_id: groupId, user_id: user.id, status: 'active' } });
        if (!userPartOfGroup) return errorResponse(res, "User not part of the group");

        const member = await GroupMembers.findOne({
            where: {
                group_id: groupId,
                user_id: memberId,
                status: 'active'
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name']
                }
            ]
        });
        if (!member) return errorResponse(res, "Member not part of the group");

        // Database queries
        await GroupMembers.update(
            { status: 'left' },
            { where: { group_id: groupId, user_id: memberId } }
        );

        if (memberId === group.admin) {
            await Groups.update({ admin: null }, { where: { id: groupId } })
        }

        // For system messages in groups
        const systemMessage = await GroupMessages.create({
            group_id: groupId,
            sender_id: null,
            message: `${user.name?.split(' ')[0]} removed ${member?.user?.name?.split(" ")[0]}`,
            type: 'system',
        });

        const io = req.app.get('io');

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

        io.to(`group_${groupId}`).emit("newGroupMessage", { message, groupId, groupName: group?.name });
        io.to(`user_${memberId}`).emit("removedFromGroup", { group });

        return successPostResponse(res, {}, "User successfully removed the group")
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
}

const setAdmin = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { memberId } = req.body;
        const user = req.user;

        const group = await Groups.findOne({
            where: {
                id: groupId,
            },
            attributes: [
                'id',
                'name',
                ['super_admin', 'superAdmin'],
                'admin',
            ],
            raw: true
        });

        if (group.superAdmin !== user.id) return errorResponse(res, "Only Super Admin can set admins");
        if (group.admin) return errorResponse(res, "Admin already set, remove admin to set a new admin")
        if (group.superAdmin === memberId) return errorResponse(res, "Cannot set self to admin");

        const member = await GroupMembers.findOne({ where: { group_id: groupId, user_id: memberId, status: 'active' } });
        if (!member) return errorResponse(res, "User not part of the group");

        await Groups.update(
            { admin: memberId },
            { where: { id: groupId } }
        );

        return successResponse(res, {}, "Admin successfully set");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const removeAdmin = async (req, res) => {
    try {
        const groupId = req.params.id;
        // const { adminId } = req.body;
        const user = req.user;

        const group = await Groups.findOne({
            where: {
                id: groupId,
            },
            attributes: [
                'id',
                'name',
                ['super_admin', 'superAdmin'],
                'admin'
            ],
            raw: true,
        });
        if (group.superAdmin !== user.id) return errorResponse(res, "Only Super Admin can remove admins");
        if (group.admin === null) return errorResponse(res, "No admin to remove")

        // const member = await GroupMembers.findOne({ where: { group_id: groupId, user_id: adminId, status: 'active' } });
        // if (!member) return errorResponse(res, "User not part of the group");

        await Groups.update(
            { admin: null },
            { where: { id: groupId } }
        );

        return successResponse(res, {}, "Admin successfully removed");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const getGroupInfo = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;

        let group = await Groups.findOne({
            where: { id },
            attributes: ['id', 'name', 'super_admin', 'admin', 'createdAt', 'group_image_url'],
            include: [
                {
                    model: User,
                    as: "members",
                    attributes: ["id", "name", "email", ["profile_image_url", "profileImageUrl"]],
                    through: { where: { status: 'active' }, attributes: [] },
                },
            ],
        });

        group = group.get({ plain: true });

        const groupObj = {
            id: group.id,
            name: group.name,
            superAdmin: group.super_admin,
            admin: group.admin,
            groupImageUrl: group.group_image_url,
            createdAt: group.createdAt,
        }

        const superAdmin = group.super_admin;
        const admin = group.admin;
        const members = group.members;

        // Find friends that are not members
        let nonMemberFriends = [];
        console.log(superAdmin, user.id, admin);
        if (superAdmin === user.id || admin === user.id) {
            let memberIds = members.map((mem) => mem.id);

            const friends = await Friends.findAll({
                where: {
                    status: 'accepted',
                    [Op.or]: [
                        { sender_id: user.id },
                        { receiver_id: user.id },
                    ]
                }
            });

            let friendIds = friends.map((frnd) => {
                let id;
                if (frnd.receiver_id === user.id) id = frnd.sender_id;
                else id = frnd.receiver_id;
                return id;
            });

            const inviteFriendIds = [];
            friendIds.map((id) => {
                if (!memberIds.includes(id)) inviteFriendIds.push(id);
            });

            // console.log(inviteFriendIds);
            nonMemberFriends = await User.findAll({
                where: {
                    id: inviteFriendIds
                },
                attributes: ['id', 'name', 'email', ["profile_image_url", "profileImageUrl"]],
                raw: true
            });

        }

        const data = {
            group: groupObj,
            members,
            nonMemberFriends,
        }

        return successResponse(res, data, "Fetched group information");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const editGroupInfo = async (req, res) => {
    try {
        try {
            // console.log(req.body);
            const user = req.user;
            const groupId = req.params.id;

            const name = req.body?.name;
            const file = req?.file;

            const group = await Groups.findOne({ where: { id: groupId } });
            if (!group) return errorResponse(res, "Group not found");

            if (group.super_admin !== user.id && group.admin !== user.id) return errorResponse(res, "Only admins can update group details")

            if (name) group.name = name;
            if (file) group.group_image_url = file.path;

            await group.save();

            const groupObj = {
                id: group.id,
                name: group.name,
                superAdmin: group.super_admin,
                admin: group.admin,
                groupImageUrl: group.group_image_url,
                createdAt: group.createdAt,
            }

            const systemMessage = await GroupMessages.create({
                group_id: groupId,
                sender_id: null,
                message: `${user.name?.split(' ')[0]} updated the group details`,
                type: 'system',
            });

            const io = req.app.get('io');

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

            io.to(`group_${groupId}`).emit("newGroupMessage", { message, groupId, groupName: group?.name });

            return successResponse(res, groupObj, 'Successfully updated the group details');

        } catch (error) {
            return errorThrowResponse(res, error.message, error);
        }
    } catch (error) {

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
    inviteToGroup,
    removeFromGroup,
    setAdmin,
    removeAdmin,
    getGroupInfo,
    editGroupInfo,
};

