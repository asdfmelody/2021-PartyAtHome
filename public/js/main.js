/**
 * Socket.io socket
 */
 let socket;
 /**
  * The stream object used to send media
  */
 let localStream = null;
 /**
  * All peer connections
  */
 let peers = {}
 
 var count = 1;
 
 const messagesEl = document.querySelector('.messages');
 const messageInput = document.getElementById('message-input');
 const sendButton = document.getElementById('message-button');
 const canvas = document.getElementById('localCanvas');
 const partyCanvas = document.getElementById('partyCanvas');
 const partyButton = document.getElementById('partyButton');
 const filterButton = document.getElementById('filterButton');

 const logMessage = (message) => {
     const newMessage = document.createElement('div');
     newMessage.className = 'message'
     newMessage.innerText = message;
     messagesEl.appendChild(newMessage);
 };
 
 // redirect if not https
 if(location.href.substr(0,5) !== 'https') 
     location.href = 'https' + location.href.substr(4, location.href.length - 4)
 
 
 //////////// CONFIGURATION //////////////////
 
 /**
  * RTCPeerConnection configuration 
  */
 const configuration = {
     "iceServers": [{
             "urls": "stun:stun.l.google.com:19302"
         },
         // public turn server from https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
         // set your own servers here
         {
             url: 'turn:192.158.29.39:3478?transport=udp',
             credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
             username: '28224511:1379330808'
         }
     ]
 }
 
 /**
  * UserMedia constraints
  */
 let constraints = {
     audio: true,
     video: {
         width: {
             max: 300
         },
         height: {
             max: 300
         }
     }
 }
 
 /////////////////////////////////////////////////////////
 
 constraints.video.facingMode = {
     ideal: "user"
 }
 
 // enabling the camera at startup
 navigator.mediaDevices.getUserMedia(constraints).then(stream => {
     console.log('Received local stream');
 
     localVideo.srcObject = stream;
     localStream = stream;
 
     init(stream)
 
 }).catch(e => alert(`getusermedia error ${e.name}`))
 
 /**
  * initialize the socket connections
  */
 function init(stream) {
     socket = io()
 
 
     socket.on('initReceive', socket_id => {
         console.log('INIT RECEIVE ' + socket_id)
         addPeer(socket_id, false)
         socket.emit('initSend', socket_id)
     })
 
     socket.on('initSend', socket_id => {
         console.log('INIT SEND ' + socket_id)
         addPeer(socket_id, true)
     })
 
     socket.on('removePeer', socket_id => {
         console.log('removing peer ' + socket_id)
         removePeer(socket_id)
     })
 
     socket.on('disconnect', () => {
         console.log('GOT DISCONNECTED')
         for (let socket_id in peers) {
             removePeer(socket_id)
         }
     })
 
     socket.on('signal', data => {
         peers[data.socket_id].signal(data.signal)
     })
 
     sendButton.addEventListener('click', () => {
         // GET message from input
         const message = messageInput.value;
         // Clean input
         messageInput.value = '';
         // Log Message Like Sended
          
         socket.emit('message', message);
         //localStream.sendMessage(message);    
     });
 
     socket.on("createMessage", message => {
         logMessage(`${message}`);
     })
 
 }
 
 /**
  * Remove a peer with given socket_id. 
  * Removes the video element and deletes the connection
  * @param {String} socket_id 
  */
 function removePeer(socket_id) {
 
     let videoEl = document.getElementById(socket_id)
     if (videoEl) {
 
         const tracks = videoEl.srcObject.getTracks();
 
         tracks.forEach(function (track) {
             track.stop()
         })
 
         videoEl.srcObject = null
         videoEl.parentNode.removeChild(videoEl)
     }
     if (peers[socket_id]) peers[socket_id].destroy()
     delete peers[socket_id]
 }
 
 /**
  * Creates a new peer connection and sets the event listeners
  * @param {String} socket_id 
  *                 ID of the peer
  * @param {Boolean} am_initiator 
  *                  Set to true if the peer initiates the connection process.
  *                  Set to false if the peer receives the connection. 
  */
 function addPeer(socket_id, am_initiator) {
     peers[socket_id] = new SimplePeer({
         initiator: am_initiator,
         stream: localStream,
         config: configuration
     })
 
     peers[socket_id].on('signal', data => {
         socket.emit('signal', {
             signal: data,
             socket_id: socket_id
         })
     })
 
     peers[socket_id].on('stream', stream => {
         let newVid = document.createElement('video')
         count++
         newVid.srcObject = stream
         newVid.id = socket_id
         newVid.playsinline = false
         newVid.autoplay = true
         newVid.className = "vid";
         //newVid.onclick = () => openPictureMode(newVid)
         newVid.ontouchstart = (e) => openPictureMode(newVid)
         if(count < 3) {
             videos.appendChild(newVid)
         } else {
             videos2.appendChild(newVid)
         }
         
     })
 }
 
 /**
  * Opens an element in Picture-in-Picture mode
  * @param {HTMLVideoElement} el video element to put in pip mode
  */
 function openPictureMode(el) {
     console.log('opening pip')
     el.requestPictureInPicture()
 }

function partyFilter() {
    console.log('party stream')
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        if (partyButton.innerText == "Party") {
            birthdayParty();
            stream = partyCanvas.captureStream()
            socket.emit('partyMessage');
            partyButton.innerText = "Stop Party"
        }
        else {
            socket.emit('partyMessage');
            partyButton.innerText = "Party"
        }
        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        break;
                    }
                }
            }
        }
        localStream = stream
        localVideo.srcObject = localStream
    })
}

function faceFilter() {
    console.log('face filter stream')
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        if (filterButton.innerText == "Filter") {
            dog_faceFilter()
            stream = canvas.captureStream()
            filterButton.innerText = "No Filter"
        }
        else {
            filterButton.innerText = "Filter"
        }

        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        break;
                    }
                }
            }
        }
        localStream = stream
        localVideo.srcObject = localStream
    })
}

 /**
  * Switches the camera between user and environment. It will just enable the camera 2 cameras not supported.
  */
 function switchMedia() {
     if (constraints.video.facingMode.ideal === 'user') {
         constraints.video.facingMode.ideal = 'environment'
     } else {
         constraints.video.facingMode.ideal = 'user'
     }
 
     const tracks = localStream.getTracks();
 
     tracks.forEach(function (track) {
         track.stop()
     })
 
     localVideo.srcObject = null
     navigator.mediaDevices.getUserMedia(constraints).then(stream => {
 
         for (let socket_id in peers) {
             for (let index in peers[socket_id].streams[0].getTracks()) {
                 for (let index2 in stream.getTracks()) {
                     if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                         peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                         break;
                     }
                 }
             }
         }
 
         localStream = stream
         localVideo.srcObject = stream
 
         updateButtons()
     })
 }
 
 /**
  * Enable screen share
  */
 function setScreen() {
     navigator.mediaDevices.getDisplayMedia().then(stream => {
         for (let socket_id in peers) {
             for (let index in peers[socket_id].streams[0].getTracks()) {
                 for (let index2 in stream.getTracks()) {
                     if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                         peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                         break;
                     }
                 }
             }
 
         }
         localStream = stream
 
         localVideo.srcObject = localStream
         socket.emit('removeUpdatePeer', '')
     })
     updateButtons()
 }
 
 /**
  * Disables and removes the local stream and all the connections to other peers.
  */
 function removeLocalStream() {
     if (localStream) {
         const tracks = localStream.getTracks();
 
         tracks.forEach(function (track) {
             track.stop()
         })
 
         localVideo.srcObject = null
     }
 
     for (let socket_id in peers) {
         removePeer(socket_id)
     }
 }
 
 /**
  * Enable/disable microphone
  */
 function toggleMute() {
     for (let index in localStream.getAudioTracks()) {
         localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
         muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
     }
 }
 /**
  * Enable/disable video
  */
 function toggleVid() {
     for (let index in localStream.getVideoTracks()) {
         localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
         vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
     }
 }
 
 function toggleGame() {
     var gamestate = gameButton.innerText;
     if (gamestate == 'Game Start') {       
         var ini = prompt("Set Initial");
         if(ini == null) {
             alert("Canceled");
         } else {
             socket.emit('gameMessage', 'starts Initial Game');
             socket.emit('message', ini);
             gameButton.innerText = "Game End";
         }
     } else {
         socket.emit('gameMessage', 'ends Initial Game');
         gameButton.innerText = "Game Start";
     }
 }
 
 /**
  * updating text of buttons
  */
 function updateButtons() {
     for (let index in localStream.getVideoTracks()) {
         vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
     }
     for (let index in localStream.getAudioTracks()) {
         muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
     }
 }
 
 
