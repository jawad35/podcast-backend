const express = require('express');
const app = express();
require('dotenv').config();
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
const userRoute = require('./routes/user')
const mediaRoute = require('./routes/media')
const subsRoute = require('./routes/subs');
// const SocketServer = require('./SocketServer');
const Port = process.env.PORT || 8000
const cors = require("cors");
app.use(cors());
//adding socket.io configuration
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// io.on('connection', socket => {
//     SocketServer(socket)
// })

  // io.on('connection', (socket) => {
  //   console.log('a user connected');
   
  // })


require('./db/database')
app.use('/api/user',userRoute)
app.use('/api/media',mediaRoute)
app.use('/api/subs',subsRoute)



app.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
});