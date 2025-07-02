const sequelize = require('./database');

const User = require('./users');
const Message = require('./message');
const Friends = require('./friends');
const Groups = require('./groups');
const GroupMembers = require('./groupMembers');
const GroupMessages = require('./groupMessages');
const GroupMessageRead = require('./groupMessageRead');
const MessageReactions = require('./messageReactions');

// -----------------------------------------

// User-Messages
User.hasMany(Message, {
  foreignKey: 'sender_id',
  as: 'sentMessages',
});

User.hasMany(Message, {
  foreignKey: 'receiver_id',
  as: 'receivedMessages',
});

Message.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender',
});

Message.belongsTo(User, {
  foreignKey: 'receiver_id',
  as: 'receiver',
});

// -----------------------------------------

// User-Friends
User.hasMany(Friends, {
  foreignKey: 'sender_id',
  as: 'sentRequests',
});

User.hasMany(Friends, {
  foreignKey: 'receiver_id',
  as: 'receivedRequests',
});

Friends.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender',
});

Friends.belongsTo(User, {
  foreignKey: 'receiver_id',
  as: 'receiver',
});

// --------------------------------------------

// Groups-GroupMembers
Groups.hasMany(GroupMembers, { foreignKey: "group_id", as: "groupMembers", });
GroupMembers.belongsTo(Groups, { foreignKey: "group_id", as: "group" });

// User–GroupMember
User.hasMany(GroupMembers, { foreignKey: "user_id", as: "groupMembers" });
GroupMembers.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User-Groups (many-to-many via GroupMembers)
User.belongsToMany(Groups, {
  through: GroupMembers,
  foreignKey: "user_id",
  otherKey: "group_id",
  as: 'groups'
});

Groups.belongsToMany(User, {
  through: GroupMembers,
  foreignKey: "group_id",
  otherKey: "user_id",
  as: "members"
});

// Group–GroupMessage
Groups.hasMany(GroupMessages, { foreignKey: "group_id", as: "messages" });
GroupMessages.belongsTo(Groups, { foreignKey: "group_id", as: "group" });

// User–GroupMessage
User.hasMany(GroupMessages, { foreignKey: "sender_id", as: "sentGroupMessages" });
GroupMessages.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

// GroupMessage–GroupMessageRead
GroupMessages.hasMany(GroupMessageRead, { foreignKey: "group_message_id", as: "reads" });
GroupMessageRead.belongsTo(GroupMessages, { foreignKey: "group_message_id", as: "message" });

// User–GroupMessageRead
User.hasMany(GroupMessageRead, { foreignKey: "user_id", as: "readGroupMessages" });
GroupMessageRead.belongsTo(User, { foreignKey: "user_id", as: "reader" });

// --------------------------------------------------------------------------------------------------

// User–MessageReactions
User.hasMany(MessageReactions, {
  foreignKey: 'user_id',
  as: 'reactions'
});

MessageReactions.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// --------------------------------------------------------------------------------------------------

// Private message replies
Message.belongsTo(Message, {
  foreignKey: 'reply_to',
  as: 'repliedMessage'
});

Message.hasMany(Message, {
  foreignKey: 'reply_to',
  as: 'replies'
});

// Group message replies
GroupMessages.belongsTo(GroupMessages, {
  foreignKey: 'reply_to',
  as: 'repliedMessage'
});

GroupMessages.hasMany(GroupMessages, {
  foreignKey: 'reply_to',
  as: 'replies'
});

module.exports = {
  User,
  Message,
  Friends,
  Groups,
  GroupMembers,
  GroupMessages,
  GroupMessageRead,
  MessageReactions,
};