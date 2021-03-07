const express = require('express');
const socketio = require('socket.io');
const http = require('http');
peers = {}
// Create server
const app = express();
const server = http.Server(app);

// Map HTML and Javascript files as static
app.use(express.static('public'));

// Init Socket IO Server
const io = socketio(server);

// Array to map all clients connected in socket
let connectedUsers = [];

// Called whend a client start a socket connection
io.on('connection', (socket) => {
  // It's necessary to socket knows all clients connected
  connectedUsers.push(socket.id);

  // Emit to myself the other users connected array to start a connection with each them
  const otherUsers = connectedUsers.filter(socketId => socketId !== socket.id);
  socket.emit('other-users', otherUsers);

  // Send Offer To Start Connection
  socket.on('offer', (socketId, description) => {
    //addPeer(socket.id, false)
    socket.to(socketId).emit('offer', socket.id, description);
  });

  // Send Answer From Offer Request
  socket.on('answer', (socketId, description) => {
    socket.to(socketId).emit('answer', description);
    //addPeer(socket.id, true)
  });

  // Send Signals to Establish the Communication Channel
  socket.on('candidate', (socketId, candidate) => {
    socket.to(socketId).emit('candidate', candidate);
  });

  // Remove client when socket is disconnected
  socket.on('disconnect', () => {
    connectedUsers = connectedUsers.filter(socketId => socketId !== socket.id);
  });
});

// io.on('connect', (socket) => {
//   console.log('a client is connected')


//   // Initiate the connection process as soon as the client connects

//   peers[socket.id] = socket

//   // Asking all other clients to setup the peer connection receiver
//   for(let id in peers) {
//       if(id === socket.id) continue
//       console.log('sending init receive to ' + socket.id)
//       peers[id].emit('initReceive', socket.id)
//   }

//   /**
//    * relay a peerconnection signal to a specific socket
//    */
//   socket.on('signal', data => {
//       console.log('sending signal from ' + socket.id + ' to ', data)
//       if(!peers[data.socket_id])return
//       peers[data.socket_id].emit('signal', {
//           socket_id: socket.id,
//           signal: data.signal
//       })
//   })
// })

// Return Index HTML when access root route
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start server in port 3000 or the port passed at "PORT" env variable
server.listen(process.env.PORT || 3000,
  () => console.log('Server Listen On: *:', process.env.PORT || 3000));
