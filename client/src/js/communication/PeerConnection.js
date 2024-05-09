// export default PeerConnection;

import MediaDevice from "./MediaDevice";
import Emitter from "./Emitter";
import socket from "./socket";

const PC_CONFIG = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    },
    {
      urls: "stun:stun1.l.google.com:19302"
    },
  ],
  optional: [{ 'googEchoCancellation': true }, { 'googAutoGainControl': true }, { 'googNoiseSuppression': true }]

};


class PeerConnection extends Emitter {
  constructor(friendID) {
    super();
    this.pc = new RTCPeerConnection(PC_CONFIG);
    this.friendID = friendID;
    this.mediaDevice = new MediaDevice();
    this.callId = null; // Store callId for use in signaling events
    this.from = null; // Store callId for use in signaling events
    this.iceCandidatesQueue = [];  // Initialize an array to hold ICE candidates
      this.isRemoteDescriptionSet = false;  // Flag to check if remote description is set

      this.pc.onicecandidate = event => {
        if (event.candidate) {
            // console.log('Sending ICE candidate:', event.candidate);
            socket.emit('webrtc_ice_candidate', {
                candidate: event.candidate.toJSON(),  // Convert candidate to JSON
                to: this.friendID,
});
        }
      };
      

    
    // Monitor ICE connection state changes
    this.pc.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State: ${this.pc.iceConnectionState}`);
      if (this.pc.iceConnectionState === "connected") {
        console.log("Peer connection established.");
      }
    };
    

  
    this.pc.ontrack = (event) => {
      if (event.streams.length > 0) {
        this.emit("peerStream", event.streams[0]); // Emit custom event
      }
    };
    // Set up listeners for incoming WebRTC signaling events
    this.setupListeners();
  }

  setupListeners() {
    socket.on('initiate-offer', async (data) => {
      console.log('Server requested to initiate offer with call ID:', data.callId);
      this.callId = data.callId;  // Store the callId for future reference
      this.createAndSendOffer();
    });
socket.on('call-created', data => {
  // console.log('Created call with ID:', data.callId);
  // Update the callId in the client's state
  if (data.callId ) {  // Ensure the message is intended for this user
      this.callId = data.callId;
      this.from = data.from
      // console.log('Updated call ID to:', this.callId);
     
  }
});

    socket.on("webrtc_offer", (event) => {
      console.log("Webrtc offer ---======&&&", event)

      if (event.from === this.friendID) {
        this.setRemoteDescription(event.sdp);
        this.createAnswer();
      }
    });
    socket.on("webrtc_answer", (event) => {
      console.log("Received WebRTC Answer:", event);
      if (event.from === this.friendID) {
          this.setRemoteDescription(new RTCSessionDescription(event.type, event.sdp));
      }
  });

    // socket.on("webrtc_ice_candidate", (event) => {
    //   console.log("Webrtc ice data ---======&&&", event)
    //   if (event.callId) {
    //     this.addIceCandidate(event.candidate);
    //   }
    // });
    socket.on("webrtc_ice_candidate", (event) => {
      if (event.candidate) {
        const candidate = new RTCIceCandidate(event.candidate);
        this.pc.addIceCandidate(candidate)
          .then(() => console.log("ICE candidate added successfully"))
          .catch(error => console.error("Failed to add ICE candidate:", error));
      }
    });
    
  }
  // Implement the accept method
  async accept(offer, callId, callFrom) {
    try {
      // Correcting this.peerConnection to this.pc
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      // Emit the answer to the signaling server to be sent to the caller
      socket.emit("webrtc_answer", { sdp: answer, to: this.friendID, from:callFrom,  callId: callId });
    } catch (error) {
      console.error("Error during call acceptance:", error);
    }
  }

  addStream(stream) {
    // console.log("Tracks to be added:", stream.getTracks());
    stream.getTracks().forEach((track) => {
      this.pc.addTrack(track, stream);
    });
    this.emit("localStream", stream);
  }
  
  start(isCaller, id) {
    this.mediaDevice
      .on("stream", async (stream) => {
        // console.log("Local stream tracks to be added:", stream.getTracks());

        // Add each track from the stream to the peer connection
        stream.getTracks().forEach((track) => {
          this.pc.addTrack(track, stream);
        });
// from,
        // Emit local stream for local display
        this.emit("localStream", stream);

        if (isCaller) {
          // Caller: Emitting the creation of the call to inform the server or other peers
          socket.emit("create-call", { to: this.friendID, from: id });

          try {
            // Create an offer and set it as the local description
            const offer = await this.pc.createOffer();
            // console.log("Offer created:", offer);
            if (!offer.type || !offer.sdp) {
              throw new Error("Invalid offer created");
            }
            await this.pc.setLocalDescription(offer);
            // console.log("Local description set successfully with offer");

            // Emit the offer via the signaling channel to the remote peer
            socket.emit("webrtc_offer", {
              to: this.friendID,
              sdp: offer.sdp,
              from: id,
            });

            // console.log("Offer sent to localStorage:", offer);
            localStorage.setItem("webrtcOffer", JSON.stringify(offer));
          } catch (error) {
            // console.error("Error creating or sending offer:", error);
          }
        } else {
          // Callee: Prepare to receive an offer and create an answer
          // Set up to handle offer received from the caller
          // console.log("Error on webrtc")
          socket.on("webrtc_offer", async (data) => {
            if (data.from === this.friendID) {
              console.log("Offer received:", data.sdp);
              try {
                await this.pc.setRemoteDescription(
                  new RTCSessionDescription(data)
                );
                const answer = await this.pc.createAnswer();
                await this.pc.setLocalDescription(answer);

                // Emit the answer via the signaling channel back to the remote peer
                socket.emit("webrtc_answer", {
                  from: this.friendID,
                  sdp: answer.sdp,
                  to: id,

                });

                console.log("Answer sent:", answer);
              } catch (error) {
                console.error("Error responding to offer:", error);
              }
            }
          });
        }
      })
      .start();

    return this;
  }

  stop() {
    // if (isStarter) {
    // }
    socket.emit("end-call", { to: this.friendID });
    this.mediaDevice.stop();
    this.pc.close();
    this.pc = null;
    this.off();
    return this;
  }

 
  async createOffer() {
    try {
      const offer = await this.pc.createOffer();
      console.log("Offer created:", offer);
      if (!offer.type || !offer.sdp) {
        throw new Error("Invalid offer created");
      }
      await this.pc.setLocalDescription(offer);
      console.log("Local description set successfully with offer");

      localStorage.setItem("webrtcOffer", JSON.stringify(offer));
      this.emit("offerCreated", offer);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }
 
  async createAnswer() {
    try {
      const desc = await this.pc.createAnswer();
      await this.pc.setLocalDescription(desc);
      localStorage.setItem("webrtcAnswer", JSON.stringify(desc)); // Save the answer to localStorage
      this.emit("answerCreated", desc); // Emit the event to notify that the answer has been created
      return desc; // Return the descriptor
    } catch (error) {
      console.error("Error in createAnswer:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
  async createAndSendOffer() {
    try {
        // Create an offer using the RTCPeerConnection
        const offer = await this.pc.createOffer();
        console.log("Offer created:", offer);

        // Set the created offer as the local description of the peer connection
        await this.pc.setLocalDescription(offer);
        // console.log("Local description set successfully with offer:", offer);

        // Send the offer to the server to be forwarded to the other peer
        socket.emit('webrtc_offer', {
            sdp: offer.sdp,
            from: this.friendID,
            callId: this.callId, // Include the call ID to identify the call session
        });
        // console.log("Offer sent to the server:", offer);

        // Optionally, store the offer in local storage for recovery or other purposes
        localStorage.setItem("webrtcOffer", JSON.stringify(offer));
    } catch (error) {
        console.error("Error creating or sending offer:", error);
        // Optionally, handle errors specifically, e.g., re-try logic or alert user
    }
}

  getDescription(desc) {
    this.pc.setLocalDescription(desc);
    socket.emit("webrtc_offer", {
      to: this.friendID,
      sdp: desc,
      callId: this.roomId,
    });
    return this;
  }


  async setRemoteDescription(sdp) {
    console.log("setting remote from Peer ==>", sdp)
    try {
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        this.isRemoteDescriptionSet = true;
        this.processIceCandidatesQueue();
    } catch (error) {
        console.error("Error setting remote description:", error);
    }
}

  setLocalDescription(desc) {
    console.log("localDescription data =======>>>>", desc);
    // Proxy method to RTCPeerConnection's setLocalDescription
    const rtcSdp = new RTCSessionDescription(desc);
    console.log("setting localDescription =======>>>>", rtcSdp);
    this.pc.setLocalDescription(rtcSdp);
    return this;
  }

  // addIceCandidate(candidate) {
  //   if (candidate) {
  //     const iceCandidate = new RTCIceCandidate(candidate);
  //     this.pc.addIceCandidate(iceCandidate);
  //   }
  //   return this;
  // }
  addTrack(track, stream) {
    return this.pc.addTrack(track, stream);
}

addIceCandidate(candidate) {
  if (this.isRemoteDescriptionSet) {
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(error => console.error("Error adding ICE candidate:", error));
  } else {
      this.iceCandidatesQueue.push(candidate);
  }
}

processIceCandidatesQueue() {
  while (this.iceCandidatesQueue.length > 0) {
      const candidate = this.iceCandidatesQueue.shift();
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(error => console.error("Error adding ICE candidate from queue:", error));
  }
}


startRecording(remoteStream) {
  if (remoteStream) {
    const chunks = [];
    const mediaRecorder = new MediaRecorder(remoteStream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = url;
      a.download = `recorded_video_${Date.now()}.webm`;
      a.click();

      // Clean up the anchor element
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    };

    mediaRecorder.start();
    this.mediaRecorder = mediaRecorder;
    this.recording = true;
  }
}


stopRecording() {
  if (this.mediaRecorder && this.recording) {
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.recording = false;
  }
}
// handleICECandidateEvent = event => {
//   if (event.candidate) {
//       console.log('Local ICE candidate:', event.candidate);
//       socket.emit('webrtc_ice_candidate', {
//           candidate: event.candidate.toJSON(),  // Ensure the candidate is in the correct format
//                     to: this.friendID,

//       });
//   }
// };
}

export default PeerConnection;




