const { Op } = require("sequelize");
const {
    successResponse,
    errorResponse,
    errorThrowResponse,
} = require("../../helper/response");
const { Message, MessageReactions, GroupMessages, GroupMembers } = require("../../models");

const toCamelCase = (obj) => {
    const camelCaseObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
        camelCaseObj[camelKey] = obj[key];
    }
    return camelCaseObj;
};

const reactMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const { targetType, reaction } = req.body;
        const user = req.user;

        const io = req.app.get('io');

        // For private 1 to 1 Messages
        if (targetType === 'private') {

            const message = await Message.findOne({
                where: {
                    id: id,
                    is_deleted: false,
                    [Op.or]: [
                        { sender_id: user.id },
                        { receiver_id: user.id },
                    ]
                }
            });

            if (!message) return errorResponse(res, "Message not found or cannot be reacted to");

            let existing = await MessageReactions.findOne({
                where: {
                    target_id: id,
                    user_id: user.id,
                    target_type: 'private',
                },
            });

            if (existing) {
                existing.reaction = reaction;
                await existing.save();
            }
            else {
                existing = await MessageReactions.create({
                    user_id: user.id,
                    target_id: id,
                    target_type: targetType,
                    reaction,
                });
            }

            let friendId;
            if (message.sender_id === user.id) friendId = message.receiver_id;
            else friendId = message.sender_id;

            const userName = await existing.getUser({ attributes: ['name'] });

            const receiverRoom = `user_${friendId}`;
            const senderRoom = `user_${user.id}`;

            const reactionObj = {
                reactionId: existing.id,
                messageId: existing.target_id,
                userId: existing.user_id,
                userName: userName.name,
                reaction: existing.reaction,
                createdAt: existing.createdAt,
                targetType: existing.target_type
            }

            io.to(senderRoom).emit('messageReaction', { reactionObj });
            io.to(receiverRoom).emit('messageReaction', { reactionObj });

            return successResponse(res, reactionObj, "Successfully reacted to the private message");
        }

        // For Group Messages
        else if (targetType === 'group') {

            const message = await GroupMessages.findOne({ where: { id, type: 'text', is_deleted: false } });
            if (!message) return errorResponse(res, "Invalid Message");

            const isMember = await GroupMembers.findOne({
                where: {
                    group_id: message.group_id,
                    user_id: user.id
                }
            })

            if (!isMember) return errorResponse(res, "User not part of the group");

            let existing = await MessageReactions.findOne({
                where: {
                    target_id: id,
                    user_id: user.id,
                    target_type: 'group',
                },
            });

            if (existing) {
                existing.reaction = reaction;
                await existing.save();
            }
            else {
                existing = await MessageReactions.create({
                    user_id: user.id,
                    target_id: id,
                    target_type: targetType,
                    reaction,
                });
            }

            const userName = await existing.getUser({ attributes: ['name'] });

            // const camelCaseReaction = toCamelCase(existing.toJSON());
            const reactionObj = {
                reactionId: existing.id,
                messageId: existing.target_id,
                userId: existing.user_id,
                userName: userName.name,
                reaction: existing.reaction,
                createdAt: existing.createdAt,
                targetType: existing.target_type
            }

            io.to(`group_${message.group_id}`).emit('messageReaction', { reactionObj });

            return successResponse(res, reactionObj, "Successfully reacted to the group message");
        }

        else return errorResponse(res, "Invalid Target Type");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const deleteReactions = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;

        const existing = await MessageReactions.findOne({ where: { target_id: id, user_id: user.id } });
        if (!existing) return errorResponse(res, "Invalid Message Reaction");

        await existing.destroy();

        const io = req.app.get('io');

        // Emit to relevant room
        if (existing.target_type === 'private') {
            const msg = await Message.findByPk(existing.target_id);
            if (!msg) return errorResponse(res, "Message not found");

            let friendId;
            if (msg.sender_id === user.id) friendId = msg.receiver_id;
            else friendId = msg.sender_id;

            io.to(`user_${user.id}`).emit('messageReactionRemoved', {
                messageId: existing.target_id,
                userId: user.id,
            });

            io.to(`user_${friendId}`).emit('messageReactionRemoved', {
                messageId: existing.target_id,
                userId: user.id,
            });
        } else if (existing.target_type === 'group') {
            const msg = await GroupMessages.findByPk(existing.target_id);
            if (!msg) return errorResponse(res, "Message not found");

            io.to(`group_${msg.group_id}`).emit('messageReactionRemoved', {
                messageId: existing.target_id,
                userId: user.id,
            });
        }

        return successResponse(res, {}, "Reaction deleted successfully")
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

module.exports = {
    reactMessage,
    deleteReactions,
};