const { Op } = require("sequelize");
const { Friends, User } = require("../models");

class FriendService {
    static async getFriends(userId) {
        const friends = await Friends.findAll({
            where: {
                status: "accepted",
                [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
            },
            include: [
                {
                    model: User,
                    as: "sender",
                    attributes: ["id", "name", "email", "profile_image_url"],
                },
                {
                    model: User,
                    as: "receiver",
                    attributes: ["id", "name", "email", "profile_image_url"],
                },
            ],
            attributes: ["id", "sender_id", "receiver_id", "status"],
        });

        return friends.map(friend => {
            const other = friend.sender_id === userId ? friend.receiver : friend.sender;
            return {
                id: other.id,
                name: other.name,
                email: other.email,
                profileImageUrl: other.profile_image_url,
            };
        });
    }

    static async getFriendship(userId, otherUserId) {
        return await Friends.findOne({
            where: {
                status: "accepted",
                [Op.or]: [
                    {
                        sender_id: userId,
                        receiver_id: otherUserId,
                    },
                    {
                        sender_id: otherUserId,
                        receiver_id: userId,
                    },
                ],
            },
        });
    }

    static async findRelationship(userId, otherUserId) {
        return await Friends.findOne({
            where: {
                [Op.or]: [
                    {
                        sender_id: userId,
                        receiver_id: otherUserId,
                    },
                    {
                        sender_id: otherUserId,
                        receiver_id: userId,
                    },
                ],
            },
        });
    }

    static async sendFriendRequest({ senderId, receiverId, io, }) {
        const request = await Friends.create({
            sender_id: senderId,
            receiver_id: receiverId,
        });

        if (io) {
            io.to(`user_${receiverId}`)
                .emit("newFriendReqSent");
        }

        return request;
    }

    static async validateFriends(userId, members) {

        const friends = await this.getFriends(userId);
        const friendIds = new Set(friends.map(friend => friend.id));

        const invalidMembers = members.filter(member => {
            const id = typeof member === "object" ? member.id : member;
            return !friendIds.has(id);
        });

        return {
            valid: invalidMembers.length === 0,
            invalidMembers,
        };
    }
}

module.exports = FriendService;