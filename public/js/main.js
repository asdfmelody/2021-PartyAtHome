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
 var filter_count = 1;
 var filterText = "Dog Filter"
 
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

     socket.on('partySoundOn', () => {
        audio.play()
     })

     socket.on('partySoundOff', () => {
        audio.pause()
        audio.currentTime = 0
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
            var canvasStream = partyCanvas.captureStream()
            var audioTrack = stream.getTracks().filter(function(track) {
                return track.kind === 'audio'
            })[0];

            canvasStream.addTrack(audioTrack)
            stream = canvasStream;
            socket.emit('partyStart');
            partyButton.innerText = "Stop Party"
        }
        else {
            JEELIZFACEFILTER2D.destroy()
            socket.emit('partyStop');
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
        localVideo.srcObject = stream
    })
}

function faceFilter() {
    console.log('face filter stream')
    
    if(filter_count ==1 ){
        dog_faceFilter();
        filter_count++;
        console.log('dog filter stream')
        filterText="Tiger Filter"

    }else if(filter_count ==2){
        tiger_faceFilter();
        filter_count++;
        console.log('tiger filter stream')
        filterText="Werewolf Filter"

    }else if (filter_count ==3){
        werewolf_faceFilter();
        filter_count=0
        console.log('werewolf filter stream')
        filterText="No Filter"
    } else {
        JEELIZFACEFILTER3.destroy()
        filter_count=1
        filterText="Dog Filter"
    }
    
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        if (filter_count != 1) {
            var canvasStream = canvas.captureStream()
            var audioTrack = stream.getTracks().filter(function(track) {
                return track.kind === 'audio'
            })[0];

            canvasStream.addTrack(audioTrack)
            stream = canvasStream;
        }
        filterButton.innerText = filterText
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
     if (muteButton.innerText == "Unmuted") {
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16"><path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/><path fill-rule="evenodd" d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/></svg>'
        muteButton.prepend(icon)
    }
    else if (muteButton.innerText == "Muted") {
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M12.734 9.613A4.995 4.995 0 0 0 13 8V7a.5.5 0 0 0-1 0v1c0 .274-.027.54-.08.799l.814.814zm-2.522 1.72A4 4 0 0 1 4 8V7a.5.5 0 0 0-1 0v1a5 5 0 0 0 4.5 4.975V15h-3a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-3v-2.025a4.973 4.973 0 0 0 2.43-.923l-.718-.719zM11 7.88V3a3 3 0 0 0-5.842-.963L11 7.879zM5 6.12l4.486 4.486A3 3 0 0 1 5 8V6.121zm8.646 7.234l-12-12 .708-.708 12 12-.708.707z"/></svg>'
        muteButton.prepend(icon)
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
     if (vidButton.innerText == "Video Enabled") {
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/></svg>'
        vidButton.prepend(icon)
   }
    else if (vidButton.innerText == "Video Disabled") {
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-off-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l6.69 9.365zm-10.114-9A2.001 2.001 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728L.847 3.366zm9.746 11.925l-10-14 .814-.58 10 14-.814.58z"/></svg>'
        vidButton.prepend(icon)
    }
 }
 
 function toggleGame() {
     var gamestate = gameButton.innerText;
     if (gamestate == "Game Start") {       
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

 function updateIcons() {
     // video button
    if (vidButton.innerText == "Video Enabled") {
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/></svg>'
        vidButton.prepend(icon)
   }
    else if (vidButton.innerText == "Video Disabled") {
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-off-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l6.69 9.365zm-10.114-9A2.001 2.001 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728L.847 3.366zm9.746 11.925l-10-14 .814-.58 10 14-.814.58z"/></svg>'
        vidButton.prepend(icon)
    }
    // mute button
    if (muteButton.innerText == "Unmuted") {
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16"><path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/><path fill-rule="evenodd" d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/></svg>'
        muteButton.prepend(icon)
    }
    else if (muteButton.innerText == "Muted") {
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M12.734 9.613A4.995 4.995 0 0 0 13 8V7a.5.5 0 0 0-1 0v1c0 .274-.027.54-.08.799l.814.814zm-2.522 1.72A4 4 0 0 1 4 8V7a.5.5 0 0 0-1 0v1a5 5 0 0 0 4.5 4.975V15h-3a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-3v-2.025a4.973 4.973 0 0 0 2.43-.923l-.718-.719zM11 7.88V3a3 3 0 0 0-5.842-.963L11 7.879zM5 6.12l4.486 4.486A3 3 0 0 1 5 8V6.121zm8.646 7.234l-12-12 .708-.708 12 12-.708.707z"/></svg>'
        muteButton.prepend(icon)
    }
 }