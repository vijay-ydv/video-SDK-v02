import React, { useState, useEffect } from "react";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import {
  Camera,
  Mic,
  MicOff,
  VideoOff,
  RefreshCw,
  Radio,
  User,
  LogOut,
  Loader,
} from "lucide-react";

const API_BASE_URL = "http://localhost:9000";

// Store meeting instance globally for access in room switching and media relay
window.currentMeeting = null;

// Participant View Component
const ParticipantView = ({ participantId, isLocal }) => {
  const { webcamStream, micStream, webcamOn, micOn, displayName } =
    useParticipant(participantId);
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (videoRef.current && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current
        .play()
        .catch((err) => console.error("Video play error:", err));
    }
  }, [webcamStream]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative shadow-lg">
      {webcamOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
          <User size={64} className="text-gray-400" />
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 px-4 py-2 rounded-lg flex items-center gap-2">
        <p className="text-sm font-semibold">{displayName || "Participant"}</p>
        {!micOn && <MicOff size={16} className="text-red-400" />}
        {isLocal && <span className="text-xs text-green-400 ml-1">(You)</span>}
      </div>
    </div>
  );
};

// Meeting View Component
const MeetingView = ({
  onMeetingLeft,
  currentRoomName,
  onSwitchRoom,
  onToggleRelay,
  isRelayActive,
  addLog,
  canSwitchToB,
  meeting,
}) => {
  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    participants,
    localParticipant,
    meeting: meetingObj,
  } = useMeeting({
    onMeetingJoined: () => {
      window.currentMeeting = meeting;
      addLog(`✅ Joined ${currentRoomName}`);
    },
    onMeetingLeft: () => {
      if (!window.currentMeeting?.keepAlive) {
        window.currentMeeting = null;
        onMeetingLeft();
      }
      addLog(`📤 Left ${currentRoomName}`);
    },
    onParticipantJoined: (participant) => {
      addLog(`👤 ${participant.displayName} joined ${currentRoomName}`);
    },
    onParticipantLeft: (participant) => {
      addLog(`👋 ${participant.displayName} left ${currentRoomName}`);
    },
  });

  const [isMicOn, setIsMicOn] = useState(true);
  const [isWebcamOn, setIsWebcamOn] = useState(true);

  useEffect(() => {
    join();
  }, []);

  const handleToggleMic = () => {
    toggleMic();
    setIsMicOn((prev) => !prev);
    addLog(`🎤 Microphone ${!isMicOn ? "enabled" : "disabled"}`);
  };

  const handleToggleWebcam = () => {
    toggleWebcam();
    setIsWebcamOn((prev) => !prev);
    addLog(`📹 Camera ${!isWebcamOn ? "enabled" : "disabled"}`);
  };

  const handleLeave = () => {
    addLog(`🚪 Leaving ${currentRoomName}...`);
    leave();
  };

  const handleSwitch = async () => {
    addLog(`🔄 Switching to Room B...`);
    onSwitchRoom(); // Call the parent's handleSwitchRoom instead of just leaving
  };

  const participantIds = [...participants.keys()];

  return (
    <div className="space-y-6">
      {/* Room Header */}
      <div
        className={`${
          currentRoomName === "Room A" ? "bg-blue-900" : "bg-purple-900"
        } rounded-lg p-5 shadow-xl`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h2 className="text-2xl font-bold">{currentRoomName}</h2>
              <p className="text-sm text-gray-300">
                {participantIds.length} participant
                {participantIds.length !== 1 ? "s" : ""} connected
              </p>
            </div>
          </div>
          {isRelayActive && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 animate-pulse">
              <Radio size={16} />
              BROADCASTING TO BOTH ROOMS
            </div>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {participantIds.map((participantId) => (
            <ParticipantView
              key={participantId}
              participantId={participantId}
              isLocal={participantId == localParticipant?.id}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={handleToggleMic}
            className={`${
              isMicOn
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex flex-col items-center gap-2`}
          >
            {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            <span className="text-sm">{isMicOn ? "Mute" : "Unmute"}</span>
          </button>

          <button
            onClick={handleToggleWebcam}
            className={`${
              isWebcamOn
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex flex-col items-center gap-2`}
          >
            {isWebcamOn ? <Camera size={24} /> : <VideoOff size={24} />}
            <span className="text-sm">
              {isWebcamOn ? "Stop Video" : "Start Video"}
            </span>
          </button>

          {canSwitchToB && (
            <button
              onClick={handleSwitch}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex flex-col items-center gap-2"
            >
              <RefreshCw size={24} />
              <span className="text-sm">Switch to Room B</span>
            </button>
          )}

          <button
            onClick={onToggleRelay}
            className={`${
              isRelayActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex flex-col items-center gap-2`}
          >
            <Radio size={24} />
            <span className="text-sm">
              {isRelayActive ? "Stop Relay" : "Start Relay"}
            </span>
          </button>

          <button
            onClick={handleLeave}
            className="bg-red-700 hover:bg-red-800 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex flex-col items-center gap-2"
          >
            <LogOut size={24} />
            <span className="text-sm">Leave Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [authToken, setAuthToken] = useState("");
  const [roomAId, setRoomAId] = useState("");
  const [roomBId, setRoomBId] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentRoomName, setCurrentRoomName] = useState(null);
  const [isRelayActive, setIsRelayActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [participantName, setParticipantName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      addLog("🚀 Initializing application...");

      // Get token
      addLog("🔑 Fetching authentication token...");
      const tokenRes = await fetch(`${API_BASE_URL}/get-token`);
      if (!tokenRes.ok) {
        throw new Error("Failed to fetch token. Check backend server.");
      }
      const tokenData = await tokenRes.json();
      setAuthToken(tokenData.token);
      addLog("✅ Token received");

      // Get or create persistent rooms
      addLog("🏠 Getting persistent rooms...");
      const roomsRes = await fetch(`${API_BASE_URL}/get-rooms`);
      if (!roomsRes.ok) {
        throw new Error("Failed to get rooms. Check backend server.");
      }
      const roomsData = await roomsRes.json();

      setRoomAId(roomsData.roomA);
      setRoomBId(roomsData.roomB);

      addLog(`✅ Room A ID: ${roomsData.roomA}`);
      addLog(`✅ Room B ID: ${roomsData.roomB}`);
      addLog(`📌 ${roomsData.message}`);

      setIsInitialized(true);
      setIsLoading(false);
      addLog("✅ Ready! Choose a room to join.");
    } catch (error) {
      console.error("Initialization error:", error);
      addLog(`❌ Error: ${error.message}`);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const joinRoom = (roomId, roomName) => {
    if (!participantName.trim()) {
      alert("Please enter your name first!");
      return;
    }

    addLog(`🚪 Joining ${roomName} as "${participantName}"...`);
    setCurrentRoomId(roomId);
    setCurrentRoomName(roomName);
  };

  const handleMeetingLeft = () => {
    setCurrentRoomId(null);
    setCurrentRoomName(null);
    setIsRelayActive(false);
  };

  // Replace the existing handleSwitchRoom function with this:

  const handleSwitchRoom = async () => {
    try {
      const targetRoomId = currentRoomName === "Room A" ? roomBId : roomAId;
      const targetRoomName = currentRoomName === "Room A" ? "Room B" : "Room A";

      addLog(`🔄 Switching to ${targetRoomName}...`);

      // Create new meeting configuration
      const meetingConfig = {
        meetingId: targetRoomId,
        name: participantName,
        micEnabled: true, // Maintain current mic state
        webcamEnabled: true, // Maintain current webcam state
      };

      // Update room state
      setCurrentRoomId(targetRoomId);
      setCurrentRoomName(targetRoomName);

      // Clear current meeting instance
      window.currentMeeting = null;

      addLog(`✅ Successfully switched to ${targetRoomName}`);
    } catch (error) {
      addLog(`❌ Room switch error: ${error.message}`);
      console.error("Room switch error:", error);

      // Reset to previous room on error
      setCurrentRoomId(currentRoomName === "Room A" ? roomAId : roomBId);
      setCurrentRoomName(currentRoomName);
    }
  };

  const toggleMediaRelay = async () => {
    try {
      const meeting = window.currentMeeting;
      if (!meeting) {
        throw new Error("No active meeting found");
      }

      const targetRoomId = currentRoomName === "Room A" ? roomBId : roomAId;

      if (!isRelayActive) {
        addLog("📡 Starting Media Relay...");

        // Enable media relay to target room
        await meeting.enableMediaRelay([
          {
            roomId: targetRoomId,
            participantId: participantName,
          },
        ]);

        setIsRelayActive(true);
        addLog(
          "✅ Media Relay ACTIVE - Your media is now being relayed to the other room!"
        );
      } else {
        addLog("⏹️  Stopping Media Relay...");

        // Disable media relay
        await meeting.disableMediaRelay();

        setIsRelayActive(false);
        addLog("✅ Media Relay stopped - Back to single room");
      }
    } catch (error) {
      addLog(`❌ Media Relay error: ${error.message}`);
      console.error("Media Relay error:", error);
      setIsRelayActive(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader
            size={64}
            className="animate-spin mx-auto mb-4 text-blue-400"
          />
          <h2 className="text-2xl font-bold mb-2">Loading VideoSDK...</h2>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl bg-red-900 bg-opacity-50 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">⚠️ Error</h2>
          <p className="text-xl mb-6">{error}</p>
          <div className="bg-black bg-opacity-30 rounded-lg p-4 text-left">
            <p className="text-sm font-mono mb-2">Troubleshooting:</p>
            <ul className="text-sm space-y-1">
              <li>1. Check if backend server is running on port 9000</li>
              <li>2. Verify .env file has VideoSDK API keys</li>
              <li>3. Check browser console for details</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            VideoSDK Room Switch
          </h1>
          <p className="text-xl text-gray-300">
            Seamless Room Switching with Media Relay
          </p>
        </div>

        {!currentRoomId ? (
          /* Room Selection Screen */
          <div className="max-w-5xl mx-auto">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-6">
              <h2 className="text-3xl font-bold mb-6 text-center">
                Choose Your Room
              </h2>

              {/* Name Input */}
              <div className="max-w-md mx-auto mb-8">
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Enter Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-lg"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    participantName.trim() &&
                    joinRoom(roomAId, "Room A")
                  }
                />
              </div>

              {/* Room Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Room A */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-center transform hover:scale-105 transition-all shadow-lg">
                  <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Room A</h3>
                  <p className="text-sm text-blue-100 mb-4">
                    Primary meeting room
                  </p>
                  <p className="text-xs font-mono text-blue-200 bg-blue-900 bg-opacity-50 rounded p-2 mb-4 truncate">
                    {roomAId}
                  </p>
                  <button
                    onClick={() => joinRoom(roomAId, "Room A")}
                    disabled={!participantName.trim()}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg transition-all"
                  >
                    Join Room A
                  </button>
                </div>

                {/* Room B */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-8 text-center transform hover:scale-105 transition-all shadow-lg">
                  <div className="bg-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Room B</h3>
                  <p className="text-sm text-purple-100 mb-4">
                    Secondary meeting room
                  </p>
                  <p className="text-xs font-mono text-purple-200 bg-purple-900 bg-opacity-50 rounded p-2 mb-4 truncate">
                    {roomBId}
                  </p>
                  <button
                    onClick={() => joinRoom(roomBId, "Room B")}
                    disabled={!participantName.trim()}
                    className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg transition-all"
                  >
                    Join Room B
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-4">📝 Demo Instructions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
                  <h4 className="font-bold mb-2 text-blue-400">
                    🔄 Room Switching Test
                  </h4>
                  <ol className="space-y-1 text-gray-300">
                    <li>1. Person A joins Room A</li>
                    <li>2. Person B joins Room B</li>
                    <li>3. Person A clicks "Switch to Room B"</li>
                    <li>4. Person A now appears in Room B with Person B</li>
                  </ol>
                </div>
                <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
                  <h4 className="font-bold mb-2 text-green-400">
                    📡 Media Relay Test
                  </h4>
                  <ol className="space-y-1 text-gray-300">
                    <li>1. Person A joins Room A</li>
                    <li>2. Person B joins Room B</li>
                    <li>3. Person A clicks "Start Relay"</li>
                    <li>4. Person A appears in BOTH rooms!</li>
                  </ol>
                </div>
              </div>
              <p className="mt-4 text-center text-gray-400 text-sm">
                💡 <strong>Tip:</strong> Open this URL in multiple browsers/tabs
                to simulate different users
              </p>
            </div>
          </div>
        ) : (
          /* Meeting Screen */
          <div className="max-w-6xl mx-auto">
            {authToken && (
              <MeetingProvider
                config={{
                  meetingId: currentRoomId,
                  micEnabled: true,
                  webcamEnabled: true,
                  name: participantName,
                  mode: "CONFERENCE", // Add this
                  multiStream: true, // Add this for better switching
                }}
                token={authToken}
                joinWithoutUserInteraction={true} // Add this
              >
                <MeetingView
                  onMeetingLeft={handleMeetingLeft}
                  currentRoomName={currentRoomName}
                  onSwitchRoom={handleSwitchRoom}
                  onToggleRelay={toggleMediaRelay}
                  isRelayActive={isRelayActive}
                  addLog={addLog}
                  canSwitchToB={currentRoomName === "Room A"}
                />
              </MeetingProvider>
            )}
          </div>
        )}

        {/* Activity Logs */}
        {currentRoomId && (
          <div className="max-w-6xl mx-auto mt-6 bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">📊 Activity Logs</h2>
            <div className="bg-black bg-opacity-50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="text-green-400 mb-1 hover:bg-gray-800 px-2 py-1 rounded"
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
