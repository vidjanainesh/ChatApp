const sequelize = require('./database');

const User = require('./users');
const Message = require('./message');
const Friends = require('./friends');

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

module.exports = {
  User,
  Message,
  Friends
};
