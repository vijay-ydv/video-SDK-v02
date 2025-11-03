# VideoSDK Room Switch with Media Relay    (Vijay Kumar Yadav)

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
