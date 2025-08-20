const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
require('./cron-jobs/ping');

const sequelize = require('./app/models/database');
const indexRoutes = require('./routes/index');
const setupSocket = require('./app/helper/socket');

const PORT = process.env.PORT || 3000;

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
// app.options('*', cors(corsOptions)); 
app.use(morgan('dev'));
app.use('/api', indexRoutes);

const server = http.createServer(app);
const io = setupSocket(server);

// Attach `io` to app so you can use it in your routes
app.set('io', io);

// sequelize.sync()
sequelize.authenticate()
  .then(() => {
    console.log('Connected to the Database');
    server.listen(PORT, () => console.log(`Server Listening on PORT ${PORT} `));
  })
  .catch((e) => console.log(e));