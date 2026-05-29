const express = require("express");
const path = require("path");
const http = require("http");
const axios = require("axios");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
});

app.use(express.json());

/* ── SERVE ENTIRE PUBLIC FOLDER (handles all subpaths automatically) ── */
app.use(express.static(path.join(__dirname, "../public")));

/* ── FALLBACK for root ── */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

/* ── DISASTER API ── */
app.get("/api/disasters", async (req, res) => {
  try {
    const quakeRes = await axios.get(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
      { timeout: 8000 }
    );
    const earthquakes = quakeRes.data.features.map(q => ({
      type: "earthquake",
      title: q.properties.place,
      magnitude: q.properties.mag,
      radius: 50000,
      coordinates: { lat: q.geometry.coordinates[1], lng: q.geometry.coordinates[0] },
    }));
    const tsunami = earthquakes
      .filter(q => q.magnitude >= 7)
      .map(q => ({ type: "tsunami", title: `Potential tsunami near ${q.title}`, magnitude: q.magnitude, radius: 120000, coordinates: q.coordinates }));

    let weather = [];
    try {
      const wKey = process.env.WEATHER_API_KEY || "9196d3efbc112fad4a24095bf3a27ea1";
      const wRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Visakhapatnam&appid=${wKey}`,
        { timeout: 6000 }
      );
      const wd = wRes.data;
      weather = [{ type: "severe weather", title: wd.weather[0].description, magnitude: wd.wind.speed, radius: 90000, coordinates: { lat: wd.coord.lat, lng: wd.coord.lon } }];
    } catch {}

    res.json([...earthquakes, ...tsunami, ...weather]);
  } catch (err) {
    console.error("Disaster API:", err.message);
    res.status(500).json({ error: "Disaster fetch failed" });
  }
});

/* ── SOCKET STATE ── */
let waitingUser = null;
let activeSOS = [];

io.on("connection", socket => {
  console.log("Connected:", socket.id);

  if (waitingUser && waitingUser !== socket.id && io.sockets.sockets.has(waitingUser)) {
    io.to(waitingUser).emit("peer-ready", socket.id);
    io.to(socket.id).emit("peer-ready", waitingUser);
    waitingUser = null;
  } else {
    waitingUser = socket.id;
  }

  socket.on("offer", ({ offer, to }) => io.to(to).emit("offer", { offer, from: socket.id }));
  socket.on("answer", ({ answer, to }) => io.to(to).emit("answer", { answer, from: socket.id }));
  socket.on("ice-candidate", ({ candidate, to }) => io.to(to).emit("ice-candidate", { candidate, from: socket.id }));

  socket.emit("active-sos", activeSOS);
  socket.on("send-sos", data => { activeSOS.push(data); io.emit("receive-sos", data); });
  socket.on("help-accepted", data => io.emit("helper-accepted", data));
  socket.on("resolve-sos", id => { activeSOS = activeSOS.filter(s => s.id != id); io.emit("sos-resolved", id); });

  socket.on("disconnect", () => {
    if (waitingUser === socket.id) waitingUser = null;
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Vyuha running → http://localhost:${PORT}`));
