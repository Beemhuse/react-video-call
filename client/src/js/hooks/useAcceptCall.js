import React, { useEffect } from 'react';
// Assume imports for setPc, setLocalSrc, setPeerSrc, etc., are done correctly.

const useAcceptCall = async ({ pc, setPc, offer, callFrom, config, setLocalSrc, setPeerSrc, setCallModal, socket, clientID }) => {
    console.log("Offer ===>", offer);
    console.log("Accepting the call");

    if (!callFrom || !offer || !config) {
        console.error("Attempt to accept a call without sufficient data:", { callFrom, offer, config });
        return;
    }

    if (!pc) {
        console.log("Initializing new PeerConnection");
        const newPc = new PeerConnection(callFrom, config);
        setPc(newPc);  // This updates the state to hold the new PeerConnection instance

        newPc.on('peerStream', (peerStream) => {
            console.log("Received peer stream", peerStream);
            setPeerSrc(peerStream);  // Update the state to display the remote video
        });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            newPc.addStream(stream);
            setLocalSrc(stream);  // Update the state to display the local video
        } catch (error) {
            console.error("Failed to get local stream with error:", error);
            return;  // Exit if cannot get local stream
        }

        // Make sure the PeerConnection is set before proceeding
        await newPc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await newPc.createAnswer();
        await newPc.setLocalDescription(new RTCSessionDescription(answer));
        socket.emit('webrtc_answer', { sdp: answer, to: callFrom });
        setCallModal(''); // Close any call modal if open
        socket.emit('join-call', { callId: clientID });
        console.log("Client ID:", clientID);
    }
};


export default useAcceptCall;
