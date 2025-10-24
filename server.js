// server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory storage for test data
const readings = [];

// Base route
app.get("/", (_req, res) => {
  res.send("VitalWeave backend running ✅");
});

// Receive POSTs from ESP32
app.post("/ingest", (req, res) => {
  const { deviceId, stream, value } = req.body || {};
  if (!deviceId || !stream)
    return res.status(400).json({ error: "bad payload" });

  const row = { deviceId, stream, value, ts: Date.now() };
  readings.push(row);
  console.log("ingest:", row);
  res.json({ ok: true });
});

// Get latest data
app.get("/latest", (_req, res) => {
  res.json(readings.slice(-50)); // last 50 readings
});

// Optional: quick HTML inspector page
app.get("/inspect", (_req, res) => {
  res.type("html").send(`
    <!doctype html><meta charset="utf-8"/>
    <h1>VitalWeave Readings</h1>
    <pre id="out">loading…</pre>
    <script>
      async function tick(){
        const r = await fetch('/latest');
        const j = await r.json();
        document.getElementById('out').textContent =
          JSON.stringify(j, null, 2);
      }
      tick(); setInterval(tick, 2000);
    </script>
  `);
});

// Start server on Render-assigned port
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ VitalWeave backend listening on port ${port}`);
});
