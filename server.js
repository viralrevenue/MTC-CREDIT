// server.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* -------------------------- 📁 File Paths -------------------------- */
const FILE_PATH = "./credits.json";
const DEGREE2_FILE = "./degree2-codes.json";
const DEGREE2_CHAT_FILE = "./degree2-chat.json";
const DEGREE2_REQUESTS_FILE = "./degree2-requests.json";

/* -------------------------- 🔐 Secret PINs -------------------------- */
const FREE_PIN = "FREEMASON";
const PREMIUM_PIN = "MASTERGUARD";

/* -------------------------- 🛠 Middleware -------------------------- */
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

/* -------------------------- 🔐 PIN Verification -------------------------- */
app.post("/check-pin", (req, res) => {
  const { pin } = req.body;
  if (pin?.trim().toUpperCase() === FREE_PIN) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.post("/check-premium-pin", (req, res) => {
  const { pin } = req.body;
  if (pin?.trim().toUpperCase() === PREMIUM_PIN) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

/* -------------------------- 📂 Utilities -------------------------- */
function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/* -------------------------- 🧾 Free Tier Routes -------------------------- */
app.get("/api/codes", (req, res) => {
  const codes = loadJSON(FILE_PATH);
  res.json(codes);
});

app.post("/api/codes", (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false });

  const codes = loadJSON(FILE_PATH);
  codes.push(code);
  saveJSON(FILE_PATH, codes);
  res.status(201).json({ success: true });
});

app.delete("/api/codes/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const codes = loadJSON(FILE_PATH);
  if (codes[index]) {
    codes.splice(index, 1);
    saveJSON(FILE_PATH, codes);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false });
  }
});

/* -------------------------- 💎 Degree 2 Premium Routes -------------------------- */

// ✅ Save phone number requests
app.post("/api/degree2-requests", (req, res) => {
  const { number } = req.body;
  if (!number)
    return res.status(400).json({ success: false, error: "Missing number" });

  const requests = loadJSON(DEGREE2_REQUESTS_FILE);
  requests.push({ number, time: new Date().toLocaleString() });
  saveJSON(DEGREE2_REQUESTS_FILE, requests);

  res.status(201).json({ success: true });
});

// ✅ Degree 2 Codes
app.get("/api/degree2-codes", (req, res) => {
  const codes = loadJSON(DEGREE2_FILE);
  res.json(codes);
});

app.post("/api/degree2-codes", (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false });

  const codes = loadJSON(DEGREE2_FILE);
  codes.push(code);
  saveJSON(DEGREE2_FILE, codes);

  res.status(201).json({ success: true });
});

app.delete("/api/degree2-codes/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const codes = loadJSON(DEGREE2_FILE);
  if (codes[index]) {
    codes.splice(index, 1);
    saveJSON(DEGREE2_FILE, codes);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false });
  }
});

// ✅ Degree 2 Chat REST API
app.get("/api/degree2-chat", (req, res) => {
  const messages = loadJSON(DEGREE2_CHAT_FILE);
  res.json(messages);
});

app.post("/api/degree2-chat", (req, res) => {
  const { name, text } = req.body;
  if (!text) return res.status(400).json({ success: false });

  const messages = loadJSON(DEGREE2_CHAT_FILE);
  messages.push({
    name: name || "Anonymous",
    text,
    time: new Date().toLocaleTimeString(),
  });
  saveJSON(DEGREE2_CHAT_FILE, messages);

  res.status(201).json({ success: true });
});

/* -------------------------- 📡 Socket.IO Chat -------------------------- */
io.on("connection", (socket) => {
  console.log("📡 A user connected to Degree 2 chat");

  socket.on("loadChatHistory", () => {
    const messages = loadJSON(DEGREE2_CHAT_FILE);
    socket.emit("chatHistory", messages);
  });

  socket.on("sendChatMessage", (msgObj) => {
    const messages = loadJSON(DEGREE2_CHAT_FILE);
    messages.push(msgObj);
    saveJSON(DEGREE2_CHAT_FILE, messages);

    io.emit("newChatMessage", msgObj); // broadcast to all
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected from Degree 2 chat");
  });
});

/* -------------------------- 🚀 Start Server -------------------------- */
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
