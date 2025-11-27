const { DataTypes } = require("sequelize");
const db = require("../config/config");

const Event = db.define(
  "event",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateRaw: {
      type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.STRING,
    },
    location: {
      type: DataTypes.STRING,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
  }
);

const initEventModel = async () => {
  await Event.sync(); // use { force: true } to drop & recreate, or { alter: true }
};

// Save events (insert all without deduplication)
const saveEvents = async (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    console.log("❌ No events to save.");
    return;
  }

  let savedCount = 0;
  let errorCount = 0;

  console.log(`💾 Attempting to save ${events.length} events to database`);

  for (const e of events) {
    if (!e || !e.title) {
      errorCount++;
      continue;
    }

    try {
      await Event.create({
        title: e.title.trim(),
        dateRaw: e.dateRaw || e.rawDate || null,
        date: e.date || null,
        location: e.location || "Unknown Location",
        time: e.time || null,
        image: e.image || null,
        link: e.link || null,
        price: e.price || null,
        category: e.category || null,
        source: e.source || "unknown",
      });

      savedCount++;
      console.log(`✅ Saved event: ${e.title.trim()}`);
    } catch (error) {
      errorCount++;
      console.error("❌ Error saving event:", e.title, error.message);
    }
  }

  console.log(`💾 Save Results: ${savedCount} saved, ${errorCount} errors`);
  return savedCount;
};

// Get all stored events
const getStoredEvents = async () => {
  const events = await Event.findAll({
    order: [["dateRaw", "ASC"]],
  });
  return events.map((e) => e.toJSON());
};

// Get events by link
const getEventsBySource = async (source) => {
  if (!source) {
    throw new Error("Source parameter is required");
  }

  const events = await Event.findAll({
    where: {
      source: source,
    },
    order: [["dateRaw", "ASC"]],
  });

  return events.map((e) => e.toJSON());
};

// Get event by link (single result)
const getEventByLink = async (link) => {
  if (!link) {
    throw new Error("Link parameter is required");
  }

  const event = await Event.findOne({
    where: {
      link: link,
    },
  });

  return event ? event.toJSON() : null;
};

module.exports = {
  Event,
  initEventModel,
  saveEvents,
  getStoredEvents,
  getEventsBySource,
  getEventByLink,
};
