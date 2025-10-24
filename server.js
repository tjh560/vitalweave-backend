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
  const { deviceId, stream, value } = body || {};
  if (!deviceId || !stream) return null;
  return { deviceId, stream, value, ts: Date.now() };
}
function latest() {
  return readings.length ? readings[readings.length - 1] : null;
}

// ---------- base/health ----------
app.get("/", (_req, res) => res.send("VitalWeave backend running ✅"));
app.get("/health", (_req, res) => res.json({ ok: true, count: readings.length }));

// ---------- ingest (kept old path + new versioned path) ----------
app.post("/ingest", (req, res) => {
  const row = toRow(req.body);
  if (!row) return res.status(400).json({ error: "bad payload" });
  readings.push(row);
  console.log("ingest:", row);
  res.json({ ok: true });
});
app.post("/api/v1/ingest", (req, res) => {
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
app.get("/api/v1/vitals", (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 1000);
  res.set("Cache-Control", "no-store");
  res.json(readings.slice(-limit));
});

/**
 * GET /api/v1/vitals/latest
 * Returns the single most recent reading (404 if none yet)
 */
app.get("/api/v1/vitals/latest", (_req, res) => {
  const row = latest();
  if (!row) return res.status(404).json({ error: "no data yet" });
  res.set("Cache-Control", "no-store");
  res.json(row);
});

// ---------- legacy convenience (kept for your inspector page) ----------
app.get("/latest", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(readings.slice(-50)); // last 50 readings
});

// ---------- quick HTML inspector ----------
app.get("/inspect", (_req, res) => {
  res.type("html").send(`<!doctype html><meta charset="utf-8"/>
  <h1>VitalWeave Readings</h1>
  <p><a href="/api/v1/vitals/latest" target="_blank">/api/v1/vitals/latest</a> |
     <a href="/api/v1/vitals?limit=10" target="_blank">/api/v1/vitals?limit=10</a></p>
  <pre id="out">loading…</pre>
  <script>
    async function tick(){
      const r = await fetch('/api/v1/vitals?limit=20');
      const j = await r.json();
      document.getElementById('out').textContent = JSON.stringify(j, null, 2);
    }
    tick(); setInterval(tick, 2000);
  </script>`);
});

// ---------- start ----------
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(` ٩(◕‿◕)۶ VitalWeave backend listening on port ${port}`);
});