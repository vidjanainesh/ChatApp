const express = require('express');
const http = require('http');
const app = express();
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./models/database');
const indexRoutes = require('./routes/index');
const morgan = require('morgan');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: '*',
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
    optionsSuccessStatus: 200,
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.emit('newMessage', { test: 'hello from server' });

  socket.on('typing', (data) => {
    // data: { senderId, receiverId, isTyping }
    socket.broadcast.emit('typing', data);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected on server:', socket.id, 'Reason:', reason);
  });
});

// Attach `io` to app so you can use it in your routes
app.set('io', io);

app.use(morgan('dev'));

app.use('/api', indexRoutes);

// sequelize.sync({force: true})
sequelize.authenticate()
  .then(() => {
    console.log('Connected to the Database');
    server.listen(3000, () => console.log('Server Listening on PORT 3000'));
  })
  .catch((e) => console.log(e));