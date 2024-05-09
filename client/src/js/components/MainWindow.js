import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  faPhone,
  faMicrophone,
  faVideo,
  faCamera,
  faShareFromSquare,
  faMicrophoneLinesSlash,
  faShareSquare,
} from "@fortawesome/free-solid-svg-icons";
import ActionButton from "./ActionButton";
import { socket } from "../communication";
import videoIcon from "../../assets/video.png"; // Changed the variable name for clarity
// import { FaMicrophone } from "react-icons/fa";

// Toggle the audio track (mute/unmute) for a specific stream
function toggleAudio(stream, isMuted) {
  console.log(stream, "audio toggle with status ==>" + isMuted);
  if (stream) {
    const audioTracks = stream.getAudioTracks();
    console.log("audio Tracks", audioTracks, "status ==>", isMuted);
    audioTracks.forEach((track) => {
      track.enabled = isMuted;
    });
  }
}

// Toggle the video track (hide/show) for a specific stream
function toggleVideo(stream, isVideoOff) {
  if (stream) {
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !isVideoOff;
    });
  }
}

function MainWindow({
  pc,
  clientName,
  localSrc,
  peerSrc,
  setPeerSrc,
  isLocalAudioMuted,
  setIsLocalAudioMuted,
  setIsLocalVideoOff,
  isLocalVideoOff,
  clientID,
  callFrom,
}) {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");
  const userName = urlParams.get("name");
  const friendId = urlParams.get("friendId");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [endCall, setEndCall] = useState(false);
  const [isUserName, setIsUserName] = useState(userName);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaveVideo, setIsSaveVideo] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  // const [recordedChunks, setRecordedChunks] = useState([]);

  // useEffect(() => {
  //   if(pc){

  //     pc.on('recordingStopped', ({ blob, url }) => {
  //       // Handle the recorded video blob and URL here
  //       setRecordedVideo({ blob, url });
  //       setIsRecording(false);
  //     });
  //   }

  // }, pc)

  // const startRecording = () => {
  //   if (!peerSrc) {
  //     console.error("Stream not available");
  //     return;
  //   }

  //   const chunks = [];
  //   const recorder = new MediaRecorder(localSrc);

  //   recorder.ondataavailable = (event) => {
  //     if (event.data.size > 0) {
  //       chunks.push(event.data);
  //     }
  //   };

  //   recorder.onstop = () => {
  //     const blob = new Blob(chunks, { type: "video/webm" });
  //     const url = URL.createObjectURL(blob);
  //     setRecordedVideoUrl(url);
  //     setRecordedChunks(chunks);
  //   };

  //   recorder.start();
  //   setIsRecording(true);
  //   setMediaRecorder(recorder);
  // };

  // Function to start recording
  const startRecording = () => {
    if (!localSrc || !peerSrc) {
      console.error("Streams not available");
      return;
    }
    const localVideoTrack = localSrc.getVideoTracks()[0];
    const peerVideoTrack = peerSrc.getVideoTracks()[0];
    if (!localVideoTrack || !peerVideoTrack) {
      console.error("Video tracks not available in streams");
      return;
    }

    const mergedStream = new MediaStream([localVideoTrack, peerVideoTrack]);
    const chunks = [];
    const recorder = new MediaRecorder(mergedStream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setRecordedChunks(chunks);
    };

    recorder.start();
    setIsRecording(true);
    setMediaRecorder(recorder);
  };

  // Function to stop recording
  // const stopRecording = () => {
  //   const timer = startRecording();
  //   clearInterval(timer);
  //   pc.stopRecording();
  //   setIsRecording(false)
  //   setIsSaveVideo(true)

  // }

  // const saveVideo = () => {
  //   if (isSaveVideo) {
  //     const { blob } = recordedVideo;
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = `recorded_video_${Date.now()}.webm`;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a); // Remove the anchor element after downloading
  //     window.URL.revokeObjectURL(url);
  //   }
  //   setIsSaveVideo(false)
  // };

  const localVideo = useRef(null);
  const peerVideo = useRef(null);

  // Inside the socket.on('screen-sharing-status-changed', (data) => { ... }) event handler
  socket.on("screen-sharing-status-changed", (data) => {
    // Update the UI or store the screen sharing status for the user with ID data.userId
    if (data.screenSharing) {
      // Replace the peerSrc with the screen sharing stream
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then((stream) => {
          // Save the current peerSrc to revert back later
          const originalPeerSrc = peerSrc;

          // Set the screen sharing stream as the new peerSrc
          setPeerSrc(stream);

          // When screen sharing stops, revert back to the original stream
          stream.getVideoTracks()[0].onended = () => {
            setPeerSrc(originalPeerSrc);
          };
        })
        .catch((error) => {
          console.error("Error getting screen sharing stream:", error);
        });
    } else {
      // Revert back to the original call stream
      setPeerSrc(originalPeerSrc);
    }
  });

  socket.on("audio-status-changed", (data) => {
    // Update the UI or store the screen sharing status for the user with ID data.userId
    // console.log("audio data =>>>>>", data);
    // setIsLocalAudioMuted(data.muted)
    // localVideo.current.muted = data.muted
  });

  const handleEndCall = () => {
    // Check if peerConnection exists before calling stop method
    if (pc) {
      pc.stop();
      setEndCall(true);
    }
    // Stop local media device
    localSrc.getTracks().forEach((track) => track.stop());

    // Close peer connection
    if (peerSrc) {
      peerSrc.getTracks().forEach((track) => track.stop());
    }
  };

  const toggleScreenSharing = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setPeerSrc(screenStream);
        socket.emit("toggle-screen-sharing", {
          screenSharing: true,
          user: clientID,
        });
      } else {
        setPeerSrc(peerSrc); // Stop screen sharing by setting localSrc to null
        socket.emit("toggle-screen-sharing", { screenSharing: false });
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error("Error starting screen sharing:", error);
    }
  };

  useEffect(() => {
    socket.emit("toggle-audio", { muted: true });
    if (callFrom === friendId) {
      setIsUserName(userName);
    } else {
      setIsUserName(clientName);
    }
  }, []);

  useEffect(() => {
    if (localSrc) {
      const audioTracks = localSrc.getAudioTracks();
      // console.log("local audio Tracks", audioTracks);
      audioTracks.forEach((track) => {
        track.enabled = false;
      });
    }
  }, []);

  const handleToggleLocalAudio = (status) => {
    setIsLocalAudioMuted(status);

    localVideo.current.muted = status;
    // console.log("local video audio status ==> ", localVideo.current.muted);
    socket.emit("toggle-audio", { muted: status, id: userId });
  };

  // Toggle video for local stream
  const handleToggleLocalVideo = () => {
    setIsLocalVideoOff(!isLocalVideoOff);
    toggleVideo(localSrc, isLocalVideoOff);
    socket.emit("toggle-video", { video: !isLocalVideoOff });
  };

  useEffect(() => {
    if (localVideo.current && localSrc) {
      console.log("local Src ==> ", localVideo.current.volume);
      localVideo.current.enabled = false;
      localVideo.current.srcObject = localSrc;
    }
    if (peerVideo.current && peerSrc) {
      // console.log("peer Src ==> ", peerSrc);
      // peerVideo.current.volume = 0
      peerVideo.current.enabled = false;

      peerVideo.current.srcObject = peerSrc; // Correcting from src to srcObject
    }
  }, [localSrc, peerSrc]);

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      setIsSaveVideo(true);
    }
  };

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const downloadVideo = () => {
    if (recordedChunks.length > 0) {
      console.log("recorded video chunk ==> ", recordedChunks);
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recorded_video_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  console.log("recording video url ==>", recordedVideoUrl);
  return (
    <div className="bg-[#0F0C2A] h-[100vh] p-8 flex flex-col gap-5 items-center ">
      <div className="flex justify-between p-8 w-full">
        <img src={videoIcon} alt="Video Icon" />
        <button className="rounded-xl px-8 bg-[#242737] p-4 text-white">
          {clientID ? `Logged in as ${clientID}` : "Not logged in"}
        </button>
      </div>
      <div className="h-[80vh] relative w-full border">
        {isRecording && (
          <div className="text-white flex gap-3 items-center p-2 rounded-pill bg-[#000]/60">
            <svg
              width="33"
              height="32"
              viewBox="0 0 33 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse
                cx="16.3209"
                cy="16.114"
                rx="16.0377"
                ry="15.4793"
                fill="white"
                fill-opacity="0.63"
              />
            </svg>
            <span>

            {recordingTime} 
            </span>
            
                      </div>
        )}
        {isSaveVideo && (
          <div className="text-white flex gap-3 items-center p-2 rounded-pill bg-[#000]/30">
         <div className="bg-gray h-4 w-4 rounded-[50%] ">
         <faDotCircle className="text-[#FF4949]" />
         </div>

          <button className="text-white" onClick={downloadVideo}>
            {" "}
            Save Video
          </button>
          </div>
        )}

        {callFrom && (
          <div className="absolute top-10  z-1000 right-10  text-white  rounded-xl">
            {" "}
            {callFrom} is Calling{" "}
          </div>
        )}
        <div className=" absolute absolute bottom-10 left-10 w-[280px] h-[280px] ">
          <div className="relative">
            <video
              ref={localVideo}
              autoPlay
              muted
              className=" h-full w-full rounded-xl border border-red-500"
            />
            <div className="flex gap-4 items-center justify-between px-3 absolute bottom-10 w-full">
              <p className="bg-[#000]/30 px-4 py-2 text-white rounded-full">
                {isUserName}
              </p>
              <div className="h-10  w-10 rounded-[50%] bg-[#FF4949] flex items-center justify-center">
                <ActionButton icon={faMicrophoneLinesSlash} />
              </div>
            </div>
          </div>
        </div>
        <video
          ref={peerVideo}
          autoPlay
          muted
          className=" h-full w-full rounded-xl border border-red-500"
        />
        <div className="flex gap-4 items-center justify-center absolute bottom-10 left-0 right-0">
          <div className="h-10 w-10 rounded-[50%] bg-[#1E2757] flex items-center justify-center">
            <ActionButton icon={faCamera} />
          </div>

          <div
            className={`h-10 w-10 rounded-[50%] ${
              isScreenSharing ? "bg-[#1E2757]" : "bg-[#3252FD]"
            }  flex items-center justify-center`}
          >
            <ActionButton icon={faShareSquare} onClick={toggleScreenSharing} />
          </div>

          <button
            onClick={handleEndCall}
            disabled={endCall}
            className="text-white bg-[#FF4949] px-4 py-2 rounded-pill"
          >
            End Call
          </button>
          <div className="h-10 w-10 rounded-[50%] bg-[#1E2757] flex items-center justify-center">
            {isLocalAudioMuted ? (
              <ActionButton
                icon={faMicrophoneLinesSlash}
                onClick={() => handleToggleLocalAudio(false)}
              />
            ) : (
              <ActionButton
                icon={faMicrophone}
                onClick={() => handleToggleLocalAudio(true)}
              />
            )}
          </div>
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="h-10 w-10 rounded-[50%] bg-[#FF4949] text-white flex items-center justify-center"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="h-10 w-10 rounded-[50%] bg-[#1E2757] text-white flex items-center justify-center"
            >
              REC
            </button>
          )}
          
          {/* <button onClick={handleToggleLocalVideo} className="text-white">
            {!isLocalVideoOff ? "Show Video" : "Hide Video"}
          </button> */}
        </div>
      </div>
    </div>
  );
}

MainWindow.propTypes = {
  pc: PropTypes.object.isRequired,
  setPeerSrc: PropTypes.func.isRequired,
  localSrc: PropTypes.object,
  peerSrc: PropTypes.object,
  callFrom: PropTypes.string,
  clientID: PropTypes.string,
  clientName: PropTypes.string,
  isLocalAudioMuted: PropTypes.bool,
  isLocalVideoOff: PropTypes.bool,
  setIsLocalAudioMuted: PropTypes.func.isRequired,
  setIsLocalVideoOff: PropTypes.func.isRequired,
};

export default MainWindow;
