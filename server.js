import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

// server.js (CommonJS)
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const readings = [];

app.get("/", (_req, res) => res.send("VitalWeave backend running"));

app.post("/ingest", (req, res) => {
  const { deviceId, stream, value } = req.body || {};
  if (!deviceId || !stream) return res.status(400).json({ error: "bad payload" });
  const row = { deviceId, stream, value, ts: Date.now() };
  readings.push(row);
  console.log("ingest:", row);
  res.json({ ok: true });
});

app.get("/latest", (_req, res) => res.json(readings.slice(-50)));

// error handler to avoid silent crashes
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "server error" });
});

const port = process.env.PORT || 8080;   // Render injects PORT
app.listen(port, "0.0.0.0", () => console.log("Server listening on", port));

