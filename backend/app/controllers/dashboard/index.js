const { Op, Sequelize } = require("sequelize");
const { successResponse, errorThrowResponse } = require("../../helper/response");
const { Friends, GroupMembers, GroupMessageRead, GroupMessages, Groups, Message, User } = require("../../models");
const FriendService = require("../../services/FriendService");
const GroupService = require("../../services/GroupService");

const getDashboardData = async (req, res) => {
    try {
        const user = req.user;

        // User object
        const userObj = await User.findOne({
            where: { email: user.email },
            attributes: [
                'id',
                'name',
                'email',
                'dob',
                'gender',
                'address',
                ['phone_no', 'phoneNo'],
                ['profile_image_url', 'profileImageUrl'],
                ['profile_image_type', 'profileImageType'],
                ['profile_image_name', 'profileImageName'],
                ['profile_image_size', 'profileImageSize'],
                ['profile_image_blur_url', 'profileImageBlurUrl'],
            ]
        });

        if (!userObj) return errorResponse(res, "User not found");

        // Get Friends ---------------------------------------------------------
        const friendList = await FriendService.getFriends(user.id);

        // Get friend req count ----------------------------------------------------------------
        const friendReqs = await Friends.findAll({
            where: {
                receiver_id: user.id,
                status: 'pending'
            }
        });

        const friendReqCount = friendReqs.length;

        // Get unread private messages ---------------------------------------------------------
        const unreadCounts = await Message.findAll({
            where: {
                receiver_id: user.id,
                is_read: false
            },
            attributes: [
                'sender_id',
                // [Sequelize.fn('COUNT', Sequelize.col('id')), 'unreadCount']
            ],
            group: ['sender_id']
        });

        const unreadMap = {};
        unreadCounts.forEach(row => {
            unreadMap[row.sender_id] = true;
        });

        // Get Groups ----------------------------------------------------------------------------
        const groups = await GroupService.getGroups(user.id);

        // Get unread group messages --------------------------------------------------------------

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
                    as: 'message',
                    attributes: ["group_id"],
                },
            ],
        });

        const unreadGroupMap = {};
        unread.forEach((entry) => {
            const groupId = entry.message?.group_id;
            if (groupId) {
                unreadGroupMap[groupId] = true;
            }
        });

        // Final response object
        const dashboardData = {
            user: userObj,
            friends: friendList,
            friendReqCount,
            unreadPrivateMsgs: unreadMap,
            groups,
            unreadGroupMsgs: unreadGroupMap,
        }

        return successResponse(res, dashboardData, "Fetched Dashboard Data");
    } catch (error) {
        return errorThrowResponse(res, `${error.message}`, error);
    }
};

module.exports = getDashboardData;