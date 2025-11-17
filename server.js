const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // serve index.html

// === Proxy MPD Request (x-www-form-urlencoded) ===
app.post('/api/mpd', async (req, res) => {
  const { channelId, slug } = req.body;
  try {
    const formData = new URLSearchParams();
    formData.append('channelId', channelId);
    formData.append('slug', slug);

    const response = await fetch('https://app.swaxnet.xyz/api/mpd-url', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 51b969b5ddee963de6c75686eb75adfd5709f31fd04335ee0a2654498868',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const data = await response.json();

    // Forward mpdUrl, licenseUrl, authXmlToken to browser
    res.json({
      mpdUrl: data.mpdUrl[0],
      licenseUrl: data.licenseUrl[0],
      authXmlToken: data.authXmlToken
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch MPD' });
  }
});

// === Proxy License Request ===
app.post('/api/license', async (req, res) => {
  try {
    const { licenseUrl, authXmlToken, body: licenseBody } = req.body;
    const response = await fetch(licenseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authXmlToken}`,
        'Content-Type': 'application/octet-stream'
      },
      body: licenseBody
    });
    const buffer = await response.arrayBuffer();
    res.set('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send('License fetch failed');
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
