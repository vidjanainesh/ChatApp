const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

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
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return socket.disconnect();
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      socket.userId = userId;
    } catch (err) {
      return socket.disconnect();
    }

    socket.join(`user_${userId}`);

    socket.on('typing', (data) => {
      const receiverRoom = `user_${data.receiverId}`;
      socket.to(receiverRoom).emit('typing', data);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} userId: ${userId}, Reason: ${reason}`);
    });
  });

  return io;
}

module.exports = setupSocket;
