const express = require("express");
const db = require("./config/config");
const eventRoutes = require("./routes/routes");
const reminderRoutes = require("./routes/reminders");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const { eventSocketHandler } = require("./sockets/eventSocket");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for dev (restrict in production)
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Support both transports
  allowEIO3: true, // Backward compatibility
});

db.sync()
  .then(() => console.log("Database connection successfull"))
  .catch((error) => console.error("Database connection failed", error));

const APP_PORT = process.env.APP_PORT;

const corsOptions = {
  origin: [process.env.CLIENT_URL],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/events", eventRoutes);
app.use("/api/reminders", reminderRoutes);

eventSocketHandler(io);
require("./cronJobs/eventScraper");

server.listen(APP_PORT, () => {
  console.log("App running");
});

module.exports = { app, io };
