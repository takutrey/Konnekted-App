const express = require("express");
const db = require("./config/config");
const eventRoutes = require("./routes/routes");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const { eventSocketHandler } = require("./sockets/eventSocket");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

db.sync()
  .then(() => console.log("Database connection successfull"))
  .catch((error) => console.error("Database connection failed", error));

const APP_PORT = process.env.APP_PORT;

const corsOptions = {
  origin: [process.env.CLIENT_URL],
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/events", eventRoutes);

eventSocketHandler(io);
require("./cronJobs/eventScraper");

server.listen(APP_PORT, () => {
  console.log("App running");
});
