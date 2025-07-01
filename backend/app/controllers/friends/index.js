const { Op } = require("sequelize");
const { Friends, User } = require("../../models");
const {
    successResponse,
    errorResponse,
    errorThrowResponse,
    notFoundResponse,
} = require("../../helper/response");

const sendFriendReq = async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;

        if (user.id === id) {
            return errorResponse(
                res,
                "You can't send a friend request to yourself."
            );
        }

        const existing = await Friends.findOne({
            where: {
                [Op.or]: [
                    { sender_id: user.id, receiver_id: id },
                    { sender_id: id, receiver_id: user.id },
                ],
                status: { [Op.in]: ["pending", "accepted"] },
            },
        });

        if (existing) {
            return errorResponse(
                res,
                "Friend request already exists or you are already friends."
            );
        }

        const obj = {
            sender_id: user.id,
            receiver_id: id,
        };

        await Friends.create(obj);

        const io = req.app.get('io');
        io.to(`user_${id}`).emit('newFriendReqSent');

        return successResponse(res, {}, "Friend request sent");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
};

const unFriend = async (req, res) => {
    try {
        const friendId = req.params.id;
        const user = req.user;

        const existing = await Friends.findOne({
            where: {
                status: "accepted",
                [Op.or]: [
                    { sender_id: friendId, receiver_id: user.id },
                    { sender_id: user.id, receiver_id: friendId },
                ],
            },
        });

        if (!existing) return errorResponse(res, "User is not your friend");
        else {
            // existing.status = "rejected";
            // await existing.save();
            await existing.destroy();

            // const io = req.app.get('io');
            // io.to(`user_${friendId}`).emit('unFriend', {friendId: user.id});

            return successResponse(
                res,
                {},
                "User removed from your friends"
            );
        }
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

const manageFriendReq = async (req, res) => {
    try {
        let { id, status } = req.body;
        const user = req.user;

        // status = status == '1' ? 'accepted' : 'rejected';
        if(status === 'accepted') {
            const result = await Friends.update(
                { status },
                {
                    where: {
                        sender_id: id,
                        receiver_id: user.id,
                    },
                }
            );
            if (result[0] === 0) {
            return notFoundResponse(res, "Friend request not found");
            }
        }
        else if(status === 'rejected'){
            await Friends.destroy({
                where: {
                    sender_id: id,
                    receiver_id: user.id,
                }
            })
        }

        if(status === 'accepted'){
            const friend = await User.findOne({where: {id: user.id}, attributes: ['id', 'name', 'email']});

            const io = req.app.get('io');
            io.to(`user_${id}`).emit('friendAccepted', {friend});
        }

        return successResponse(res, {}, "Friend request status updated");
    } catch (error) {
        return errorThrowResponse(res, error.message, 500);
    }
};

const getAllFriendReq = async (req, res) => {
    try {
        const user = req.user;

        const result = await Friends.findAll({
            where: {
                receiver_id: user.id,
                status: "pending",
            },
            include: [
                {
                    model: User,
                    attributes: ["name", "email"],
                    as: "sender",
                },
            ],
            attributes: [["sender_id", "senderId"]],
        });

        return successResponse(res, result, "Fetched all req");
    } catch (error) {
        console.log("Error: ", error);
        return errorThrowResponse(res, error.message, 500);
    }
};

module.exports = {
    getAllFriendReq,
    sendFriendReq,
    manageFriendReq,
    unFriend,
};
