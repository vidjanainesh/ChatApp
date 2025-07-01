const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { GroupMembers } = require("../models"); // adjust path as needed

const allowedOrigins = [
  "http://localhost:3001",
  "https://chatapp-frontend-llqt.onrender.com",
];

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by Socket.IO CORS"));
        }
      },
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

    socket.on('joinGroupRoom', (roomId) => { socket.join(roomId) })

    // Private typing
    socket.on("typing", (data) => {
      const receiverRoom = `user_${data.receiverId}`;
      socket.to(receiverRoom).emit("typing", data);
    });

    // Group typing
    socket.on("groupTyping", ({ groupId, senderId, isTyping }) => {
      socket.to(`group_${groupId}`).emit("groupTyping", { groupId, senderId, isTyping });
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}, userId: ${userId}, Reason: ${reason}`);
    });
  });

  return io;
}

module.exports = setupSocket;