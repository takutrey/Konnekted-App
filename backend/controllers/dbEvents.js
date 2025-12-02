const Event = require("../models/events");
const redis = require("../utils/cache");

const EventsFromDB = async (req, res) => {
  try {
    const cached = await redis.get("latestEvents");

    if (cached) {
      console.log("Serving from redis cache");
      return res.status(200).json(JSON.parse(cached));
    }

    console.log("Serving from DB");
    const dbEvents = await Event.findAll();
    return res.status(200).json(dbEvents);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { EventsFromDB };
