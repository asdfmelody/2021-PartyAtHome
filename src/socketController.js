
peers = {}
names = ['panda', 'cow', 'turtle', 'hedgehog', 'whale', 'deer'];

var count = 0;

module.exports = (io) => {

    io.on('connect', (socket) => {
        
        // Initiate the connection process as soon as the client connects
        peers[socket.id] = socket
        if(count<6) {
            var name = names[count++];
        } else {
            var name = names[count-6];
            count++
        }
        

        // Asking all other clients to setup the peer connection receiver
        for(let id in peers) {
            if(id === socket.id) continue
            console.log('sending init receive to ' + socket.id)
            peers[id].emit('initReceive', socket.id)
        }

        /**
         * relay a peerconnection signal to a specific socket
         */
        socket.on('signal', data => {
            console.log('sending signal from ' + socket.id + ' to ', data)
            if(!peers[data.socket_id])return
            peers[data.socket_id].emit('signal', {
                socket_id: socket.id,
                signal: data.signal
            })
        })

        socket.on('message', (message) => {
            var msg = name + ': ' + message
            //send message to the same room
            io.sockets.emit('createMessage', msg)
        }); 

        socket.on('gameMessage', (message) => {
            var msg = '=======' + name + ' ' + message + '======='
            //send message to the same room
            io.sockets.emit('createMessage', msg)
        }); 

        socket.on('partyStart', () => {
            var msg = '=======' + 'Happy Birthday ' + name + '======='
            //send message to the same room
            io.sockets.emit('createMessage', msg)
            io.sockets.emit('partySoundOn')
        });
        
        socket.on('partyStop', () => {
            //send message to the same room
            io.sockets.emit('partySoundOff')
        });
        
        /**
         * remove the disconnected peer connection from all other connected clients
         */
        socket.on('disconnect', () => {
            console.log('socket disconnected ' + socket.id)
            socket.broadcast.emit('removePeer', socket.id)
            delete peers[socket.id]
        })

        /**
         * Send message to client to initiate a connection
         * The sender has already setup a peer connection receiver
         */
        socket.on('initSend', init_socket_id => {
            console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
            peers[init_socket_id].emit('initSend', socket.id)
        })
    })
}