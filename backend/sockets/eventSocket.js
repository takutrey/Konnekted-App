// eventSocket.js - Improved version
let ioInstance;

const eventSocketHandler = (io) => {
  ioInstance = io;

  io.engine.on("headers", (headers, req) => {
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET,POST";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    // Send welcome message
    socket.emit("welcome", {
      message: "Connected to events server",
      timestamp: new Date().toISOString(),
    });

    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.id, "Reason:", reason);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  console.log("✅ Socket.IO server initialized");
};

const emitNewEvents = (events) => {
  if (ioInstance && events.length > 0) {
    console.log(`📢 Emitting ${events.length} new events to all clients`);
    ioInstance.emit("new-events", events);
  } else {
    console.warn("❌ Socket.IO instance not initialized or no events to emit");
  }
};

module.exports = { eventSocketHandler, emitNewEvents };
