const Event = require("../models/events");
const redis = require("../utils/cache");

const EventsFromDB = async (req, res) => {
  try {
    const cached = await redis.get("latestEvents");

    if (cached) {
      const parsed = JSON.parse(cached);
      console.log(
        `🕒 Cache last updated: ${
          parsed._timestamp
            ? new Date(parsed._timestamp).toLocaleString()
            : "Unknown"
        }`
      );
      console.log("Serving from redis cache");
      return res.status(200).json(JSON.parse(cached));
    }

    console.log("Serving from DB");
    const dbEvents = await Event.findAll({ order: [["dateRaw", "ASC"]] });
    await redis.set(
      "latestEvents",
      JSON.stringify(dbEvents, {
        EX: 21600,
      })
    );
    return res.status(200).json(dbEvents);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { EventsFromDB };
