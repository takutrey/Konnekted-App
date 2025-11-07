const { DataTypes } = require("sequelize");
const db = require("../config/config");

const Event = db.define(
  "event",
  {
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
      type: DataTypes.STRING,
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

// Save events (insert new only if not exists)
const saveEvents = async (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    console.log("No events to save.");
    return;
  }

  const skippedEvents = [];

  for (const e of events) {
    if (!e) {
      skippedEvents.push(e);
      continue;
    }

    // Fallback: use e.source if link is missing
    const link = e.link || e.source;

    if (!link) {
      skippedEvents.push(e);
      continue;
    }

    try {
      await Event.findOrCreate({
        where: { link },
        defaults: {
          title: e.title || "Untitled Event",
          dateRaw: e.dateRaw || null,
          date: e.date || null,
          location: e.location || "Unknown",
          image: e.image || null,
          description: e.description || null,
        },
      });
    } catch (error) {
      console.error("Error saving event:", e, error.message);
    }
  }

  if (skippedEvents.length > 0) {
    console.warn("Skipped events due to missing 'link' and 'source':");
    console.table(skippedEvents);
  }
};

// Get all stored events
const getStoredEvents = async () => {
  const events = await Event.findAll({
    order: [["dateRaw", "ASC"]],
  });
  return events.map((e) => e.toJSON());
};

module.exports = {
  Event,
  initEventModel,
  saveEvents,
  getStoredEvents,
};
