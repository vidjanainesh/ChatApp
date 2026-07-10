const getFriends = require("../tools/getFriends");
const getGroups = require("../tools/getGroups");
const sendMessage = require("../tools/sendMessage");
const sendFriendRequest = require("../tools/sendFriendRequest");
const getPotentialFriends = require("../tools/getPotentialFriends");
const createGroup = require("../tools/createGroup");

const tools = {
    getFriends,
    getGroups,
    sendMessage,
    sendFriendRequest,
    getPotentialFriends,
    createGroup,
};

module.exports = tools;