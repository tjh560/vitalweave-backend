// server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory storage for test data
const readings = [];

// ---------- helpers ----------
function toRow(body) {
  const deviceId = body && body.deviceId;
  const stream = body && body.stream;
  const value = body && body.value;

  if (!deviceId || !stream) return null;
  return { deviceId, stream, value, ts: Date.now() };
}

function latest() {
  return readings.length ? readings[readings.length - 1] : null;
}

// Return latest reading for each (deviceId, stream) pair
function latestByKey() {
  const latestMap = new Map();
  // Walk from newest to oldest
  for (let i = readings.length - 1; i >= 0; i--) {
    const r = readings[i];
    const key = r.deviceId + ":" + r.stream;
    if (!latestMap.has(key)) {
      latestMap.set(key, r); // first seen from the end = latest
    }
  }
  return Array.from(latestMap.values());
}

// ---------- base/health ----------
app.get("/", function (_req, res) {
  res.send("VitalWeave backend running");
});

app.get("/health", function (_req, res) {
  res.json({ ok: true, count: readings.length });
});

// ---------- ingest (old path + new versioned path) ----------
app.post("/ingest", function (req, res) {
  const row = toRow(req.body);
  if (!row) return res.status(400).json({ error: "bad payload" });
  readings.push(row);
  console.log("ingest:", row);
  res.json({ ok: true });
});

app.post("/api/v1/ingest", function (req, res) {
  const row = toRow(req.body);
  if (!row) return res.status(400).json({ error: "bad payload" });
  readings.push(row);
  console.log("ingest(v1):", row);
  res.json({ ok: true });
});

// ---------- read (lists + latest) ----------
/**
 * GET /api/v1/vitals?limit=50
 * Returns last N readings (default 50, max 1000)
 */
app.get("/api/v1/vitals", function (req, res) {
  const limitRaw = req.query.limit || "50";
  const limitParsed = parseInt(limitRaw, 10);
  const clamped = Math.min(Math.max(limitParsed || 50, 1), 1000);

  res.set("Cache-Control", "no-store");
  res.json(readings.slice(-clamped));
});

/**
 * GET /api/v1/vitals/latest
 * Returns the single most recent reading (404 if none yet)
 */
app.get("/api/v1/vitals/latest", function (_req, res) {
  const row = latest();
  if (!row) return res.status(404).json({ error: "no data yet" });
  res.set("Cache-Control", "no-store");
  res.json(row);
});

/**
 * GET /api/v1/vitals/latestAll
 * Returns latest reading for each (deviceId, stream) pair
 */
app.get("/api/v1/vitals/latest", function (_req, res) {
  const row = latest();
  res.set("Cache-Control", "no-store");
  if (!row) {
    // was: return res.status(404)...
    return res.json(null);  // or { ok: true, reading: null }
  }
  res.json(row);
});


// ---------- legacy convenience (for quick testing) ----------
app.get("/latest", function (_req, res) {
  res.set("Cache-Control", "no-store");
  res.json(readings.slice(-50)); // last 50 readings
});

// ---------- start ----------
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", function () {
  console.log("VitalWeave backend listening on port " + port);
});
