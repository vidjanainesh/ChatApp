const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { GroupMembers, Message, GroupMessageRead, GroupMessages } = require("../models"); // adjust path as needed

const allowedOrigins = [
  "http://localhost:3001",
  "http://192.168.1.53:3000",
  "https://chatapp-frontend-llqt.onrender.com",
];

const onlineUsers = new Set();

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (React Native, Postman, etc.)
        if (origin === undefined || origin === null) {
          return callback(null, true);
        }

        // Allow web clients from allowed origins
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Block everything else
        console.warn("Blocked socket connection from unknown origin:", origin);
        return callback(new Error("Not allowed by CORS"));
      },

      // origin: function (origin, callback) {
      //   if (!origin || allowedOrigins.includes(origin)) {
      //     callback(null, true);
      //   } else {
      //     callback(new Error("Not allowed by Socket.IO CORS"));
      //   }
      // },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) return socket.disconnect();

    let userId;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      socket.userId = userId;
      console.log(`User: ${userId} connected`);
      onlineUsers.add(userId);
    } catch (err) {
      return socket.disconnect();
    }

    // Join private user room
    socket.join(`user_${userId}`);

    // Join all group rooms
    try {
      const memberships = await GroupMembers.findAll({
        where: { user_id: userId },
        attributes: ["group_id"],
      });

      memberships.forEach((membership) => {
        socket.join(`group_${membership.group_id}`);
      });
    } catch (err) {
      console.error("Error joining group rooms:", err);
    }

    // Join online room
    socket.join("onlineUsersRoom");

    // For online status
    socket.on("showOnline", () => {
      // 1. Send current online users to the newly joined user
      const othersOnline = Array.from(onlineUsers).filter(id => id !== userId);
      socket.emit("currentOnlineUsers", othersOnline);

      // 2. Broadcast to others that this user came online
      socket.to("onlineUsersRoom").emit("setOnline", userId);
    });


    socket.on('joinGroupRoom', (roomId) => { socket.join(roomId) });
    socket.on('leaveGroupRoom', (roomId) => { socket.leave(roomId) });

    // Private typing
    socket.on("typing", (data) => {
      const receiverRoom = `user_${data.receiverId}`;
      socket.to(receiverRoom).emit("typing", data);
    });

    socket.on("mark-messages-seen", async ({ userId, chatUserId }) => {
      // Mark all messages where chatUser sent to userId as read
      let messageIds = await Message.findAll({
        where: {
          sender_id: chatUserId,
          receiver_id: userId,
          is_read: false
        },
        attributes: ['id']
      });
      messageIds = messageIds.map(msg => msg.id);

      await Message.update(
        { is_read: true, read_at: new Date() },
        {
          where: {
            sender_id: chatUserId,
            receiver_id: userId,
            is_read: false
          }
        }
      );

      // Notify the sender (chatUserId) that their messages have been seen
      io.to(`user_${chatUserId}`).emit("messages-seen", {
        by: userId,
        chatUserId,
        messageIds,
      });
    });

    socket.on("mark-group-messages-seen", async ({ userId, groupId }) => {
      // Mark all messages where GroupID is groupId

      let groupMessagesIds = await GroupMessages.findAll({ where: { group_id: groupId, is_deleted: false }, attributes: ['id'], raw: true });
      groupMessagesIds = groupMessagesIds.map(curr => curr.id);

      let groupMsgReadIds = await GroupMessageRead.findAll({
        where: {
          user_id: userId,
          group_message_id: groupMessagesIds,
          read_at: null,
        }
      });
      groupMsgReadIds = groupMsgReadIds.map(curr => curr.id);

      await GroupMessageRead.update(
        { read_at: new Date() },
        {
          where: {
            user_id: userId,
            group_message_id: groupMessagesIds,
            read_at: null,
          }
        }
      );

      // Notify the sender (chatUserId) that their messages have been seen
      io.to(`group_${groupId}`).emit("group-messages-seen", {
        by: userId,
        groupId,
        groupMsgReadIds,
      });
    });


    // Group typing
    socket.on("groupTyping", ({ groupId, senderId, isTyping }) => {
      socket.to(`group_${groupId}`).emit("groupTyping", { groupId, senderId, isTyping });
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}, userId: ${userId}, Reason: ${reason}`);
      socket.to("onlineUsersRoom").emit("unSetOnline", userId);
      onlineUsers.delete(userId);
    });
  });

  return io;
}

module.exports = setupSocket;