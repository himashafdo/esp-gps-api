const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔐 Securely load FCM server key from environment variable (set in Render)
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

app.post('/location', async (req, res) => {
  // Log the full incoming request body to debug
  console.log("Full request body:", req.body);

  // Destructure fields including device (use device, not devices)
  const { lat, lng, motion, limit, device } = req.body;

  // Use device field or fallback to "default"
  const deviceId = device || "default";

  console.log(`📡 Received from device "${deviceId}": lat=${lat}, lng=${lng}, motion=${motion}, limit=${limit}`);

  // Build Firebase URL dynamically using deviceId
  const firebaseUrl = `https://magtic-default-rtdb.firebaseio.com/devices/${deviceId}.json`;

  try {
    // Prepare the data payload
    const payload = {
      lat,
      lng,
      motion,
      limit,
      timestamp: Date.now()
    };

    // Log payload before writing to Firebase
    console.log("Writing to Firebase:", payload);

    // Write to Firebase Realtime Database
    await axios.patch(firebaseUrl, payload);

    // If limit is true (boolean or string), send FCM notification to topic "limit_alert"
    if (limit === true || limit === "true") {
      await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        {
          to: '/topics/limit_alert',
          notification: {
            title: 'Limit Triggered!',
            body: `ESP32 device "${deviceId}" triggered the limit switch.`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${FCM_SERVER_KEY}`,
          },
        }
      );
      console.log(`✅ Push notification sent for device "${deviceId}"`);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
