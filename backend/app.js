const express = require('express');
const http = require('http');
const app = express();
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const morgan = require('morgan');

const sequelize = require('./app/models/database');
const indexRoutes = require('./routes/index');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:3001", 
  "https://chatapp-frontend-llqt.onrender.com", 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

const server = http.createServer(app);
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
    console.log('Socket connection rejected: No token');
    socket.disconnect();
    return;
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
    // You can store userId on socket for easy reference later
    socket.userId = userId;
    console.log(`User connected: ${socket.id}, userId: ${userId}`);
  } catch (err) {
    console.log('Socket connection rejected: Invalid token');
    socket.disconnect();
    return;
  }

  // Join a room with the userId to target messages easily
  socket.join(`user_${userId}`);

  // For debugging only: send a test message on connect
  // socket.emit('newMessage', { test: 'hello from server' });

  socket.on('typing', (data) => {
    // Expect data: { senderId, receiverId, isTyping }
    // Emit only to receiver's room
    const receiverRoom = `user_${data.receiverId}`;
    console.log("TYPING!!!!!!!!")
    socket.to(receiverRoom).emit('typing', data);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} userId: ${userId}, Reason: ${reason}`);
  });
});

// Attach `io` to app so you can use it in your routes
app.set('io', io);

app.use(morgan('dev'));

app.use('/api', indexRoutes);

sequelize.sync()
// sequelize.authenticate()
  .then(() => {
    console.log('Connected to the Database');
    server.listen(3000, () => console.log('Server Listening on PORT 3000'));
  })
  .catch((e) => console.log(e));