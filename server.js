import express from "express";
import fetch from "node-fetch";
import qs from "querystring";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TOKEN yako ya Swaxnet
const BEARER = "51b969b5ddee963de6c75686eb75adfd5709f31fd04335ee0a2654498868";

app.post("/api/mpd", async (req, res) => {
  const { channelId, slug } = req.body;

  if (!channelId || !slug) {
    return res.status(400).json({ error: "channelId na slug vinahitajika" });
  }

  const url = "https://app.swaxnet.xyz/api/mpd-url";
  const body = qs.stringify({ channelId, slug });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BEARER}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    const json = await response.json();
    return res.json(json);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
