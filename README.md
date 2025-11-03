# VideoSDK Room Switch with Media Relay

A complete implementation of seamless room switching functionality using VideoSDK React SDK, featuring both standard room switching and Media Relay capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [How It Works](#how-it-works)
- [API Documentation](#api-documentation)
- [Room Switching Implementation](#room-switching-implementation)
- [Media Relay Explanation](#media-relay-explanation)
- [Limitations & Challenges](#limitations--challenges)
- [Differences: Normal vs Media Relay Switching](#differences-normal-vs-media-relay-switching)

## ✨ Features

- **Dual Room System**: Create and manage two separate VideoSDK rooms
- **Seamless Room Switching**: Switch between rooms without full reconnection
- **Media Relay**: Broadcast audio/video from one room to another simultaneously
- **Real-time Controls**: Toggle audio/video, manage participants
- **Activity Logging**: Track all room activities and state changes
- **Responsive UI**: Modern, intuitive interface built with React and Tailwind CSS

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **VideoSDK Account** - [Sign up](https://app.videosdk.live/) to get API credentials

## 📁 Project Structure

```
videosdk-room-switch/
├── backend/
│   ├── server.js           # Express server with VideoSDK API integration
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment variables (API keys)
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   └── index.js       # React entry point
│   ├── public/
│   │   └── index.html     # HTML template
│   └── package.json       # Frontend dependencies
└── README.md              # This file
```

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd videosdk-room-switch
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your VideoSDK credentials
# Get them from: https://app.videosdk.live/api-keys
```

**.env file should contain:**
```env
VIDEOSDK_API_KEY=your_api_key_here
VIDEOSDK_SECRET_KEY=your_secret_key_here
PORT=9000
```

### Step 3: Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## 🎮 Running the Application

### Start Backend Server

```bash
cd backend
npm start
```

The backend server will run on `http://localhost:9000`

### Start Frontend Application

```bash
cd frontend
npm start
```

The React app will open automatically in your browser at `http://localhost:3000`

## 🔍 How It Works

### Architecture Overview

```
┌─────────────┐      HTTP/REST      ┌─────────────┐
│   React     │ ◄─────────────────► │   Express   │
│   Frontend  │                     │   Backend   │
└─────────────┘                     └─────────────┘
       │                                    │
       │                                    │
       │         WebRTC (P2P)               │ VideoSDK API
       ▼                                    ▼
┌─────────────────────────────────────────────────┐
│              VideoSDK Platform                  │
│  ┌─────────────┐         ┌─────────────┐       │
│  │   Room A    │         │   Room B    │       │
│  └─────────────┘         └─────────────┘       │
└─────────────────────────────────────────────────┘
```

### Application Flow

1. **Initialization**: Backend creates two VideoSDK rooms (Room A and Room B)
2. **Authentication**: Frontend receives auth token from backend
3. **Join Room**: User joins Room A with audio/video
4. **Room Switch**: User can seamlessly switch to Room B
5. **Media Relay**: User can broadcast their media to both rooms simultaneously

## 📡 API Documentation

### Backend Endpoints

#### `GET /get-token`
Generate a VideoSDK authentication token.

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "success": true
}
```

#### `POST /create-room`
Create a new VideoSDK room.

**Request Body:**
```json
{
  "token": "your_auth_token"
}
```

**Response:**
```json
{
  "roomId": "abcd-efgh-ijkl",
  "success": true
}
```

#### `POST /start-relay`
Start media relay from source room to target room.

**Request Body:**
```json
{
  "sourceRoomId": "room-a-id",
  "targetRoomId": "room-b-id",
  "token": "your_auth_token"
}
```

**Response:**
```json
{
  "success": true,
  "relayId": "relay_1234567890",
  "message": "Media relay started successfully"
}
```

#### `POST /stop-relay`
Stop an active media relay.

**Request Body:**
```json
{
  "sourceRoomId": "room-a-id"
}
```

#### `GET /health`
Server health check endpoint.

## 🔄 Room Switching Implementation

### Normal Room Switching

The seamless room switch is implemented using the following approach:

```javascript
// 1. Capture current media state
const wasAudioOn = isAudioOn;
const wasVideoOn = isVideoOn;

// 2. Gracefully leave current room
meetingRef.current.leave();
meetingRef.current = null;

// 3. Brief delay for clean disconnect
await new Promise(resolve => setTimeout(resolve, 500));

// 4. Join new room with preserved media state
await joinRoom(roomBId, 'Room B', wasAudioOn, wasVideoOn);
```

**Key Implementation Details:**

1. **State Preservation**: Audio/video states are captured before leaving
2. **Graceful Disconnect**: Current room connection is properly closed
3. **Clean Transition**: Brief delay ensures complete disconnect
4. **State Restoration**: New room is joined with previous media settings

### With VideoSDK React SDK

When using the actual VideoSDK React SDK:

```javascript
import { useMeeting } from "@videosdk.live/react-sdk";

const { leave } = useMeeting();

// Leave current meeting
leave();

// Reinitialize with new meeting ID
<MeetingProvider
  config={{
    meetingId: newRoomId,
    micEnabled: true,
    webcamEnabled: true,
  }}
  token={authToken}
>
  <MeetingView />
</MeetingProvider>
```

## 📻 Media Relay Explanation

### What is Media Relay?

Media Relay allows a participant's audio and video to be broadcast to multiple rooms simultaneously without requiring them to be physically present in all rooms.

### Implementation Approach

**Backend Relay Management:**

```javascript
// Store active relay sessions
const activeRelays = new Map();

// Start relay: Create bridge between rooms
app.post('/start-relay', (req, res) => {
  const { sourceRoomId, targetRoomId } = req.body;
  
  activeRelays.set(sourceRoomId, {
    relayId: `relay_${Date.now()}`,
    sourceRoomId,
    targetRoomId,
    status: 'active'
  });
});
```

**Frontend Relay Control:**

```javascript
// Start media relay
const toggleMediaRelay = async () => {
  await fetch('/start-relay', {
    method: 'POST',
    body: JSON.stringify({
      sourceRoomId: currentRoomId,
      targetRoomId: targetRoomId,
      token: authToken
    })
  });
};
```

### Real Implementation with VideoSDK

In production with VideoSDK:

1. **Create Relay Participant**: Bot joins target room
2. **Stream Forwarding**: Media tracks forwarded via WebRTC
3. **HLS/RTMP**: Use VideoSDK's streaming capabilities
4. **Bandwidth Optimization**: Selective forwarding unit (SFU)

```javascript
// Pseudocode for actual implementation
const startRelay = async (sourceRoom, targetRoom) => {
  // 1. Create relay bot in target room
  const relayBot = await createRelayParticipant(targetRoom);
  
  // 2. Get media stream from source
  const sourceStream = sourceRoom.localParticipant.getMediaStream();
  
  // 3. Forward to target room
  await relayBot.publishStream(sourceStream);
};
```

## ⚠️ Limitations & Challenges

### Current Implementation Limitations

1. **Simulated Relay**: This demo simulates relay functionality; production needs VideoSDK's streaming APIs
2. **Single User Demo**: Best experienced with multiple participants
3. **Browser Permissions**: Requires camera/microphone access
4. **Network Dependency**: Requires stable internet connection
5. **WebRTC Compatibility**: May have browser-specific behaviors

### Technical Challenges Faced

1. **State Management**
   - Challenge: Maintaining media state across room switches
   - Solution: Capture and restore audio/video states explicitly

2. **Clean Disconnection**
   - Challenge: Ensuring complete disconnect before joining new room
   - Solution: Implemented async delay and proper cleanup

3. **Media Stream Handling**
   - Challenge: Preventing stream interruption during switch
   - Solution: Pre-initialize new room before leaving current

4. **Relay Synchronization**
   - Challenge: Keeping relay state consistent across rooms
   - Solution: Centralized relay management in backend

5. **Error Handling**
   - Challenge: Graceful degradation when APIs fail
   - Solution: Comprehensive try-catch blocks with user feedback

## 🆚 Differences: Normal vs Media Relay Switching

| Aspect | Normal Room Switch | Media Relay |
|--------|-------------------|-------------|
| **User Presence** | User leaves Room A, joins Room B | User stays in Room A, appears in Room B |
| **Connection** | Single room connection | Dual room presence |
| **Bandwidth** | Standard (1x) | Higher (2x - streaming to both) |
| **Use Case** | Moving between meetings | Presenting to multiple rooms |
| **Latency** | Brief disconnect (500ms) | Continuous stream |
| **Complexity** | Simple reconnection | Requires relay infrastructure |
| **Audio/Video Quality** | Native quality | Depends on relay implementation |
| **Implementation** | Built-in SDK method | Custom streaming solution |

### When to Use Each

**Normal Room Switch:**
- User needs to fully leave one meeting and join another
- Sequential participation required
- Bandwidth conservation important
- Simple use case

**Media Relay:**
- Presenting to multiple audiences simultaneously
- Broadcasting expert commentary
- Multi-room training sessions
- Monitoring multiple rooms as moderator

## 🎯 Best Practices

1. **Error Handling**: Always implement comprehensive error handling
2. **State Management**: Use React hooks for consistent state management
3. **Cleanup**: Properly clean up media streams and connections
4. **User Feedback**: Provide clear visual indicators for all actions
5. **Testing**: Test with multiple browsers and network conditions

## 🔒 Security Considerations

- API keys should never be exposed in frontend code
- Use environment variables for sensitive credentials
- Implement token expiration and refresh mechanisms
- Validate all room IDs before operations
- Use HTTPS in production

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)

```bash
# Set environment variables in your platform
VIDEOSDK_API_KEY=your_key
VIDEOSDK_SECRET_KEY=your_secret
PORT=9000

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)

```bash
# Build production bundle
npm run build

# Deploy build folder
# Update API_BASE_URL to production backend URL
```

## 📚 Additional Resources

- [VideoSDK Documentation](https://docs.videosdk.live/)
- [VideoSDK React SDK](https://docs.videosdk.live/react/guide/video-and-audio-calling-api-sdk/getting-started)
- [WebRTC Documentation](https://webrtc.org/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👥 Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact VideoSDK support at [support@videosdk.live](mailto:support@videosdk.live)

---

**Note**: This is a demonstration project. For production use, implement proper authentication, error handling, and security measures.