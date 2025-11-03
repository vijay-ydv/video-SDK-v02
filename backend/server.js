const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 9000;

// VideoSDK API Configuration
const VIDEOSDK_API_ENDPOINT = "https://api.videosdk.live/v2";
const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY;
const VIDEOSDK_SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

// File to store persistent room IDs
const ROOMS_FILE = path.join(__dirname, "persistent-rooms.json");

// Store active relays
const activeRelays = new Map();

// In-memory storage for room IDs (will be loaded from file)
let persistentRooms = {
  roomA: null,
  roomB: null,
  createdAt: null,
};

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to generate JWT token
function generateManualToken() {
  const jwt = require("jsonwebtoken");
  const payload = {
    apikey: VIDEOSDK_API_KEY,
    permissions: ["allow_join", "allow_mod"],
    version: 2,
    roles: ["CRAWLER", "RTMP"],
  };
  return jwt.sign(payload, VIDEOSDK_SECRET_KEY, {
    algorithm: "HS256",
    expiresIn: "24h",
    jwtid: `${Date.now()}`,
  });
}

// Load persistent rooms from file
function loadPersistentRooms() {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      const data = fs.readFileSync(ROOMS_FILE, "utf8");
      persistentRooms = JSON.parse(data);
      console.log("📂 Loaded persistent rooms from file");
      console.log("   Room A:", persistentRooms.roomA);
      console.log("   Room B:", persistentRooms.roomB);
    } else {
      console.log("📂 No persistent rooms file found");
    }
  } catch (error) {
    console.error("❌ Error loading persistent rooms:", error.message);
  }
}

// Save persistent rooms to file
function savePersistentRooms() {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(persistentRooms, null, 2));
    console.log("💾 Saved persistent rooms to file");
  } catch (error) {
    console.error("❌ Error saving persistent rooms:", error.message);
  }
}

// Initialize persistent rooms on startup
loadPersistentRooms();

// Generate VideoSDK Token
app.get("/get-token", async (req, res) => {
  try {
    console.log("📝 Token generation requested...");

    if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
      console.error("❌ API keys not configured");
      return res.status(500).json({
        success: false,
        error: "VideoSDK API keys not configured. Please check your .env file.",
      });
    }

    // Try VideoSDK API first, fallback to manual JWT
    try {
      const options = {
        method: "POST",
        url: `${VIDEOSDK_API_ENDPOINT}/api-keys/generate-token`,
        headers: { "Content-Type": "application/json" },
        data: {
          apiKey: VIDEOSDK_API_KEY,
          permissions: ["allow_join", "allow_mod"],
          version: 2,
        },
        timeout: 10000,
      };

      const response = await axios(options);
      console.log("✅ Token generated via API");
      return res.json({ token: response.data.token, success: true });
    } catch (apiError) {
      console.log("⚠️  API failed, using JWT fallback...");
      const token = generateManualToken();
      console.log("✅ Token generated via JWT");
      return res.json({ token, success: true });
    }
  } catch (error) {
    console.error("❌ Error generating token:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to generate token",
      details: error.message,
    });
  }
});

// Get or create persistent rooms
app.get("/get-rooms", async (req, res) => {
  try {
    // If rooms already exist, return them
    if (persistentRooms.roomA && persistentRooms.roomB) {
      console.log("✅ Returning existing persistent rooms");
      return res.json({
        success: true,
        roomA: persistentRooms.roomA,
        roomB: persistentRooms.roomB,
        createdAt: persistentRooms.createdAt,
        message: "Using existing rooms",
      });
    }

    // Create new rooms if they don't exist
    console.log("🏠 Creating new persistent rooms...");

    // Generate token first
    let token;
    try {
      const options = {
        method: "POST",
        url: `${VIDEOSDK_API_ENDPOINT}/api-keys/generate-token`,
        headers: { "Content-Type": "application/json" },
        data: {
          apiKey: VIDEOSDK_API_KEY,
          permissions: ["allow_join", "allow_mod"],
          version: 2,
        },
        timeout: 10000,
      };
      const response = await axios(options);
      token = response.data.token;
    } catch (err) {
      token = generateManualToken();
    }

    // Create Room A
    const roomAOptions = {
      method: "POST",
      url: `${VIDEOSDK_API_ENDPOINT}/rooms`,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    };
    const roomAResponse = await axios(roomAOptions);
    persistentRooms.roomA = roomAResponse.data.roomId;

    // Create Room B
    const roomBOptions = {
      method: "POST",
      url: `${VIDEOSDK_API_ENDPOINT}/rooms`,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    };
    const roomBResponse = await axios(roomBOptions);
    persistentRooms.roomB = roomBResponse.data.roomId;

    persistentRooms.createdAt = new Date().toISOString();

    // Save to file
    savePersistentRooms();

    console.log("✅ Created new persistent rooms:");
    console.log("   Room A:", persistentRooms.roomA);
    console.log("   Room B:", persistentRooms.roomB);

    res.json({
      success: true,
      roomA: persistentRooms.roomA,
      roomB: persistentRooms.roomB,
      createdAt: persistentRooms.createdAt,
      message: "Created new rooms",
    });
  } catch (error) {
    console.error("❌ Error managing rooms:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get/create rooms",
      details: error.message,
    });
  }
});

// Reset rooms (create new ones)
app.post("/reset-rooms", async (req, res) => {
  try {
    console.log("🔄 Resetting rooms...");

    // Clear existing rooms
    persistentRooms = {
      roomA: null,
      roomB: null,
      createdAt: null,
    };

    // Delete the file
    if (fs.existsSync(ROOMS_FILE)) {
      fs.unlinkSync(ROOMS_FILE);
    }

    res.json({
      success: true,
      message: "Rooms reset. Call /get-rooms to create new ones.",
    });
  } catch (error) {
    console.error("❌ Error resetting rooms:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to reset rooms",
      details: error.message,
    });
  }
});

// Add this endpoint to your server.js
app.get("/room-info/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    // Generate token for room validation
    const token = generateManualToken();

    const options = {
      method: "GET",
      url: `${VIDEOSDK_API_ENDPOINT}/rooms/${roomId}`,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    };

    const response = await axios(options);

    res.json({
      success: true,
      room: response.data,
      activeParticipants: response.data.participants?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching room info:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch room info",
      details: error.message,
    });
  }
});

// Start Media Relay
app.post("/start-relay", async (req, res) => {
  try {
    const { sourceRoomId, targetRoomId, participantId } = req.body;

    if (!sourceRoomId || !targetRoomId) {
      return res.status(400).json({
        success: false,
        error: "Source and target room IDs required",
      });
    }

    const relayId = `relay_${Date.now()}`;
    activeRelays.set(participantId || sourceRoomId, {
      relayId,
      sourceRoomId,
      targetRoomId,
      participantId,
      startedAt: new Date(),
      status: "active",
    });

    console.log(`📡 Media relay started: ${sourceRoomId} → ${targetRoomId}`);

    res.json({
      success: true,
      relayId,
      message: "Media relay started",
      sourceRoomId,
      targetRoomId,
    });
  } catch (error) {
    console.error("❌ Error starting relay:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to start media relay",
      details: error.message,
    });
  }
});

// Stop Media Relay
app.post("/stop-relay", async (req, res) => {
  try {
    const { participantId, sourceRoomId } = req.body;
    const key = participantId || sourceRoomId;

    const relay = activeRelays.get(key);

    if (!relay) {
      return res.status(404).json({
        success: false,
        error: "No active relay found",
      });
    }

    activeRelays.delete(key);
    console.log(`🛑 Media relay stopped: ${key}`);

    res.json({
      success: true,
      message: "Media relay stopped",
      relayId: relay.relayId,
    });
  } catch (error) {
    console.error("❌ Error stopping relay:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to stop media relay",
      details: error.message,
    });
  }
});

// Get active relays
app.get("/active-relays", (req, res) => {
  const relays = Array.from(activeRelays.values());
  res.json({
    success: true,
    count: relays.length,
    relays,
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "Server running",
    timestamp: new Date().toISOString(),
    rooms: {
      roomA: persistentRooms.roomA,
      roomB: persistentRooms.roomB,
      createdAt: persistentRooms.createdAt,
    },
    activeRelays: activeRelays.size,
    config: {
      apiKeyConfigured: !!VIDEOSDK_API_KEY,
      secretKeyConfigured: !!VIDEOSDK_SECRET_KEY,
      port: PORT,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 VideoSDK Room Switch Backend");
  console.log("=".repeat(60));
  console.log(`✓ Server: http://localhost:${PORT}`);
  console.log(`✓ Health: http://localhost:${PORT}/health`);
  console.log(`✓ Get Rooms: http://localhost:${PORT}/get-rooms`);
  console.log("=".repeat(60));

  if (persistentRooms.roomA && persistentRooms.roomB) {
    console.log("\n📍 PERSISTENT ROOMS (Share these URLs):");
    console.log(`   Room A: ${persistentRooms.roomA}`);
    console.log(`   Room B: ${persistentRooms.roomB}`);
  } else {
    console.log("\n📍 No persistent rooms yet.");
    console.log("   They will be created when first user connects.");
  }

  if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
    console.log("\n⚠️  WARNING: VideoSDK credentials not configured!");
    console.log("   Set VIDEOSDK_API_KEY and VIDEOSDK_SECRET_KEY in .env");
  } else {
    console.log("\n✅ VideoSDK credentials configured");
  }
  console.log("");
});
