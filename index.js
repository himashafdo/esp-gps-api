const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/location', async (req, res) => {
  const { lat, lng, motion, device } = req.body;
  console.log(`Received from ${device}:`, lat, lng, motion);

  // ✅ Correct Firebase Realtime DB REST URL
  const firebaseUrl = `https://magtic-default-rtdb.firebaseio.com/devices/${device}.json`;

  try {
    await axios.put(firebaseUrl, { lat, lng, motion, timestamp: Date.now() });
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
