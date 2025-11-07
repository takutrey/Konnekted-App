let ioInstance;

const eventSocketHandler = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};

const emitNewEvents = (events) => {
  if (ioInstance) {
    ioInstance.emit("new-events", events);
  }
};

module.exports = { eventSocketHandler, emitNewEvents };
