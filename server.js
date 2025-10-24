import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const readings = []; // in-memory store (use a DB later)

app.get("/", (_req, res) => res.send("VitalWeave backend up"));

app.post("/ingest", (req, res) => {
  const { deviceId, stream, value } = req.body ?? {};
  const ts = Date.now();
  if (!deviceId || !stream) return res.status(400).json({ error: "bad payload" });
  readings.push({ deviceId, stream, value, ts });
  console.log("ingest:", readings.at(-1));
  res.json({ ok: true });
});

app.get("/latest", (_req, res) => res.json(readings.slice(-50)));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Server listening on", port));
