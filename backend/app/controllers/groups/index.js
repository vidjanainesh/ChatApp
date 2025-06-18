const { Op } = require("sequelize");
const { successPostResponse, errorThrowResponse, notFoundResponse, errorResponse } = require("../../helper/response");
const { Friends } = require("../../models");
const Groups = require("../../models/groups");
const GroupMessages = require("../../models/groupMessages");

const createGroup = async (req, res) => {
    try {
        const {name, memberIds} = req.body;
        const user = req.user;

        const friends = await Friends.findAll({
            where: {
                status: "accepted",
                [Op.or]: [
                    {sender_id: user.id},
                    {receiver_id: user.id}
                ]
            },
            attributes: ['sender_id', 'receiver_id']
        });
        const friendIds = friends.map((curr) => {
            if(curr.sender_id === user.id) return curr.receiver_id;
            else return curr.sender_id;
        })
        // console.log(friendIds);
        for(const id of memberIds) {
            if(!friendIds.includes(id)){
                return notFoundResponse(res, "Not a friend");
            }
        }

        const group = await Groups.create({
            name,
            created_by: user.id
        });

        memberIds.push(user.id);
        await group.addUsers(memberIds);

        return successPostResponse(res, {}, "Group generated")
    } catch (error) {
        return errorThrowResponse(res, error.message)
    }
}

const sendGroupMessage = async (req, res) => {
    try {
        const {groupId, message} = req.body;
        const user = req.user;

        const group = await Groups.findOne({where: {id: groupId}});
        const users = await group.getGroup_members_raw({attributes: ['user_id']});
        
        const userIds = users.map((curr) => curr.user_id);

        if(!userIds.includes(user.id)) {
            return errorResponse(res, "User not a part of the group")
        }
        await GroupMessages.create({
            group_id: groupId,
            sender_id: user.id,
            message
        })

        return successPostResponse(res, {}, "Message sent");

    } catch (error) {
        return errorThrowResponse(res, `${error.message}`);
    }
}

module.exports = {
    createGroup,
    sendGroupMessage
}