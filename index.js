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

  const { lat, lng, motion, limit } = req.body;

  console.log(`📡 Received:`, lat, lng, motion, limit);

  // Always write to /devices/default
  const firebaseUrl = `https://magtic-default-rtdb.firebaseio.com/devices/default.json`;

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
    await axios.put(firebaseUrl, payload);

    // If limit is true, send FCM notification to topic "limit_alert"
    if (limit === true || limit === "true") {
      await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        {
          to: '/topics/limit_alert',
          notification: {
            title: 'Limit Triggered!',
            body: `ESP32 triggered the limit switch.`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${FCM_SERVER_KEY}`,
          },
        }
      );
      console.log(`✅ Push notification sent`);
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
