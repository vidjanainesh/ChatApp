const sequelize = require('./database');

const User = require('./users');
const Message = require('./message');
const Friends = require('./friends');
const Groups = require('./groups');
const GroupMembers = require('./groupMembers');
const GroupMessages = require('./groupMessages');
const GroupMessageRead = require('./groupMessageRead');

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
Groups.hasMany(GroupMembers, { foreignKey: "group_id", as: "group_members_raw",});
GroupMembers.belongsTo(Groups, { foreignKey: "group_id", as: "group" });

// User–GroupMember
User.hasMany(GroupMembers, { foreignKey: "user_id", as: "group_members_raw" });
GroupMembers.belongsTo(User, { foreignKey: "user_id", as: "user" });

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
  as: "users"
});

// Group–GroupMessage
Groups.hasMany(GroupMessages, { foreignKey: "group_id" });
GroupMessages.belongsTo(Groups, { foreignKey: "group_id" });

// User–GroupMessage
User.hasMany(GroupMessages, { foreignKey: "sender_id" });
GroupMessages.belongsTo(User, { foreignKey: "sender_id" });

// GroupMessage–GroupMessageRead
GroupMessages.hasMany(GroupMessageRead, { foreignKey: "group_message_id" });
GroupMessageRead.belongsTo(GroupMessages, { foreignKey: "group_message_id" });

// User–GroupMessageRead
User.hasMany(GroupMessageRead, { foreignKey: "user_id" });
GroupMessageRead.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  User,
  Message,
  Friends
};