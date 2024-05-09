


import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { socket, PeerConnection } from './communication';
import MainWindow from './components/MainWindow';
import CallWindow from './components/CallWindow';
import CallModal from './components/CallModal';
// import { useWebRTC } from './WebRtcContext';
import useLocalStorage from './hooks/useLocalStorage';
// import useAcceptCall from "./hooks/useAcceptCall" 

const App = () => {
  const [callWindow, setCallWindow] = useState('');
  const [callModal, setCallModal] = useState('');
  const [callFrom, setCallFrom] = useState('');
  const [callId, setCallID] = useState('');
  const [localSrc, setLocalSrc] = useState(null);
  const [offer, setOffer] = useState(() => {
    return JSON.parse(localStorage.getItem('webrtcOffer') || 'null');
});  const [peerSrc, setPeerSrc] = useState(null);
  const [pc, setPc] = useState(null);
  const [config, setConfig] = useState(null);
  const [clientID, setClientID] = useState(null);
  const [clientName, setClientName] = useState(null);
  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(true);
  const [isLocalVideoOff, setIsLocalVideoOff] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const name = urlParams.get('name');

  useEffect(() => {
    const handleBeforeUnload = () => {
        localStorage.removeItem('webrtcOffer');  // Clear the offer on refresh
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
}, []);

    

    const localoffer = useLocalStorage('webrtcOffer'); // This will now update on changes
    useEffect(() => {
      if (localoffer) {
          setOffer(offer);
      }
      if (id && name) {
          const userData = { id, name };
          socket.emit('init', userData);
          socket.on('init', (data) => {
              console.log(data);
              document.title = `${data.id} - VideoCall`;
              setClientID(data.id);
              setClientName(data.name);
          });
      }

      return () => {
          socket.off('init');  // Clean up the socket event listener when the component unmounts
      };
  }, [id, name]);  // Depend on id, name, and offer to re-run this effect


  useEffect(() => {
    // Setup handlers for WebRTC events
    const setupWebRTCHandlers = () => {
      if (pc) {
        pc.on('localStream', (src) => {
          setCallWindow('active');
          setCallWindow('active');
          setLocalSrc(src);
          setCallModal('');
        })
        .on('peerStream', (src) => {
          setPeerSrc(src);
        });
      }
    };

    socket.on('call-created', (data) => {
      console.log('Call created with ID:', data.callId);
      if (data.callId ) {  // Ensure the message is intended for this user
        setCallID (data.callId)
        console.log('Updated call ID to from app component:', data.callId);
       
    }
      if (data.from) {
        setCallModal('active');
        setCallFrom(data.from);
        setupWebRTCHandlers();
      }
    });

    socket.on('join-call', (data) => {
      console.log(`Participant joined call: ${data.userId}`);
    });

    // Handling WebRTC offers
socket.on('webrtc_offer', async (data) => {
  console.log("Received WebRTC offer:", data);

  if (data.sdp && data.type) {
    if (pc && data.from === callFrom) {
      try {
        console.log("Setting Remote description set with offer");
        // Set remote description from the offer
        // const offerDesc = new RTCSessionDescription({ type: "offer", sdp: data.sdp });
        // await pc.setRemoteDescription(offerDesc);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));

        console.log("Remote description set with offer");

        // Create an answer to the received offer
        const answer = await pc.createAnswer();
        console.log("Answer created:", answer);

        await pc.setLocalDescription(answer);
        console.log("Local description set with answer");
// console.log(answer.sdp , "on webRTC offer, set answer to webrtcanswer")
        // Send the answer back to the caller
        // socket.emit('webrtc_answer', { sdp: answer.sdp, to: data.from });
      } catch (error) {
        console.error('Error during offer handling:', error);
      }
    }
  } else {
    console.error('Received an invalid offer or from data.');
  }
});

// Handling WebRTC answers
socket.on('webrtc_answer', async (data) => {
  console.log("Received WebRTC answer:", data);
  console.log("callFrom:", callFrom);

  if (pc ) {
    console.log("setting Remote description  with answer ======**", pc);
    try {
      // Set remote description from the answer
      const answerDesc = new RTCSessionDescription({ type: data.type, sdp: data.sdp });
      await pc.setRemoteDescription(answerDesc);
      console.log("Remote description set with answer");
      socket.emit('webrtc_answer', { sdp: answerDesc.sdp, to: data.from });

    } catch (error) {
      console.error('Error setting remote description from answer:', error);
    }
  }
});

    
  
    socket.on('webrtc_ice_candidate', async (data) => {
      console.log(data, "data from webrtc candidate client")
      if (data.callId) { // Match the correct session
        console.log(data, "data from webrtc candidate client")
          try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (error) {
              console.error('Error adding ICE candidate:', error);
          }
      }
  });
  
  

    socket.on('end', () => {
      endCall(false);
    });

    // Initialize the connection
    socket.emit('init');

    // Cleanup function to remove event listeners when the component unmounts
    return () => {
      socket.off('call-created');
      socket.off('participant-joined');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('end');
    };
  }, [pc]); // Ensure pc is tracked for updates


  // const urlParams = new URLSearchParams(window.location.search);
  const friendId = urlParams.get("friendId");
  const Id = urlParams.get("id");


  useEffect(() => {
    const config = { audio: true, video: true };
    // Call startCall function here
    startCall(true, friendId, config, Id);
  }, []); // Empty dependency array ensures this effect runs only once

  
  const startCall = async (isCaller, friendID, configuration, id) => {
    setConfig(configuration);
    console.log("caller id ...", isCaller, "your id", id)
    // Create a new PeerConnection instance
    
    const newPc = new PeerConnection(friendID);
    newPc.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State: ${newPc.pc.iceConnectionState}`);
    };
console.log("newPC for peerSRC ==> ++++++", newPc, "callID ==>", )


console.log(newPc, "the track event for remote video")

    newPc.ontrack = (event) => {
     
      if (event.streams.length > 0) {
        setPeerSrc (event.streams[0]);
        console.log('Remote stream attached to video element.');
    } else {
        console.error("No stream available in ontrack event.");
    }
  };
    setPc(newPc);
  
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: {echoCancellation: true} });
stream.getTracks().forEach(track => newPc.addTrack(track, stream));
setLocalSrc(stream); // Display the local stream in the UI

    
  console.log("nex step loading ..+++++")
     
     
  
      // Start the call if this is the initiator
      if (isCaller) {
        newPc.start(isCaller, id); // Corrected to use the existing 'start' method
      } else {
        // Receiver is prompted to accept or reject the call
        setCallModal('active');
        setCallFrom(friendID);
      }
    } catch (error) {
      console.error("Failed to get local stream with error:", error);
    }
  };

  const acceptCall = async (callFrom, config) => {
    console.log("Offer ===>", localoffer);
    console.log("Accepting the call");
  
    if (!callFrom || !localoffer || !config) {
        console.error("Attempt to accept a call without sufficient data:", { callFrom, localoffer, config });
        return;
    }
  
    let localPc = pc;  // Use a local variable to handle pc state
    if (!localPc) {
        console.log("Initializing new PeerConnection");
        localPc = new PeerConnection(callFrom, config);
        setPc(localPc); // Update the state to hold the new PeerConnection instance
  console.log(localPc, "from acept button ")
        localPc.on('peerStream', (peerStream) => {
            console.log("Received peer stream", peerStream);
            setPeerSrc(peerStream); // Update the state to display the remote video
        });
  
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: {echoCancellation: true} });
            if (stream && localPc.addStream) { // Using the older addStream method if addTrack is not available
              localPc.addStream(stream);
                      setLocalSrc(stream); // Update the state to display the local video

          } else if (stream && typeof localPc.addTrack === "function") { // Properly using addTrack if available
              stream.getTracks().forEach(track => {
                  localPc.addTrack(track, stream);
                  setLocalSrc(stream); // Update the state to display the local video
              });
          } else {
              console.error("WebRTC addTrack and addStream are not supported by this browser.");
              return; // Exit if the browser does not support necessary WebRTC features
          }
          
        } catch (error) {
            console.error("Failed to get local stream with error:", error);
            return; // Exit if cannot get local stream
        }
    }
  
    // Use the accept method defined previously
    await localPc.accept(localoffer, callId, id);
  
    setCallModal(''); // Close any call modal if open
    socket.emit('join-call', { callId: clientID, from: callFrom }); // Signal that this client joins the call
    console.log("Client ID:", clientID);
  };
  



  const rejectCall = () => {
    socket.emit('end', { to: callFrom });
    setCallModal('');
  };

  const endCall = (isStarter) => {
    if (pc && _.isFunction(pc.stop)) {
      pc.stop(isStarter);
    }
    setPc(null);
    setConfig(null);
    setCallWindow('');
    setCallModal('');
    setLocalSrc(null);
    setPeerSrc(null);
  };

  

   
  return (
    <div className='relative'>
      <MainWindow 
        localSrc={localSrc}
        peerSrc={peerSrc}
        clientName={clientName}
        pc={pc} 
        setPeerSrc={setPeerSrc} 
        callFrom={callFrom}
        clientID = {clientID}
        setIsLocalAudioMuted={setIsLocalAudioMuted}
        setIsLocalVideoOff={setIsLocalVideoOff}
        isLocalAudioMuted={isLocalAudioMuted}
        isLocalVideoOff={isLocalVideoOff}
      />
      
      {!_.isEmpty(config) && (
        <CallWindow
          status={callWindow}
          peerSrc={peerSrc}
          config={config}
          mediaDevice={pc ? pc.mediaDevice : null}
          endCall={endCall}
        />
      )}
      {
        callFrom &&
      <CallModal
        status={callModal}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
        callFrom={callFrom}
      />
      }
    </div>
  );
};

export default App;
