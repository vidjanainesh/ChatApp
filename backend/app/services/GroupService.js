const { Op } = require("sequelize");
const { Groups, User, GroupMembers, GroupMessages } = require("../models");

class GroupService {
    static async getGroups(userId) {
        let groups = await GroupMembers.findAll({
            where: { user_id: userId, status: 'active' },
            attributes: [['group_id', 'id']],
            include: [
                {
                    model: Groups,
                    as: 'group',
                    attributes: ['name', 'super_admin', 'admin', 'group_image_url']
                }
            ]
        });

        groups = groups.map((curr) => {
            curr = curr.toJSON();
            return ({
                id: curr.id,
                name: curr.group.name,
                superAdmin: curr.group.super_admin,
                admin: curr.group.admin,
                groupImageUrl: curr.group.group_image_url,
            })
        })

        return groups;
    }

    static async createGroup({ name, memberIds, creator, io, }) {

        // Create group
        const group = await Groups.create({
            name,
            super_admin: creator.id,
        });

        // Create system message
        const systemMessage = await GroupMessages.create({
            group_id: group.id,
            sender_id: null,
            message: `Group: ${name} created by ${creator.name?.split(" ")[0]}!`,
            type: "system",
        });

        // Add creator as a member
        const allMemberIds = [...new Set([...memberIds, creator.id])];

        await group.addMembers(allMemberIds);

        // Socket events
        if (io) {
            // Notify every member
            allMemberIds.forEach((memberId) => {
                io.to(`user_${memberId}`).emit("groupCreated", {
                    userId: creator.id,
                    group: {
                        id: group.id,
                        name: group.name,
                    },
                });
            });

            // Send first system message
            io.to(`group_${group.id}`).emit("newGroupMessage", {
                groupId: group.id,
                message: {
                    id: systemMessage.id,
                    senderId: null,
                    sender: {
                        name: null,
                    },
                    message: systemMessage.message,
                    type: systemMessage.type,
                    createdAt: systemMessage.createdAt,
                },
            });
        }

        return {
            id: group.id,
            name: group.name,
        };
    }

}

module.exports = GroupService;