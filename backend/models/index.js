const sequelize = require('./database');

const User = require('./users');
const Message = require('./message');

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

module.exports = {
  User,
  Message
};
