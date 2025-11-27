const { Op } = require("sequelize");
const Event = require("../models/events");

const searchEvents = async (req, res) => {
  const { search = "", fromDate, toDate } = req.query;

  const where = {};

  // Search filter for title and location
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
      { category: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Date range filter
  if (fromDate || toDate) {
    where.dateRaw = {};

    if (fromDate && toDate) {
      // Both dates provided - filter between dates
      where.dateRaw[Op.between] = [new Date(fromDate), new Date(toDate)];
    } else if (fromDate) {
      // Only from date - filter from date onwards
      where.dateRaw[Op.gte] = new Date(fromDate);
    } else if (toDate) {
      // Only to date - filter up to date
      where.dateRaw[Op.lte] = new Date(toDate);
    }
  }

  try {
    const events = await Event.findAll({
      where,
      order: [["dateRaw", "ASC"]],
    });

    return res.json(events.map((e) => e.toJSON()));
  } catch (err) {
    console.error("Error fetching filtered events:", err);
    return res.status(500).json({
      error: "Failed to fetch events",
      message: err.message,
    });
  }
};

// Optional: Add endpoint for setting reminders
const setReminder = async (req, res) => {
  const { deviceId, eventId, eventTitle, reminderDate } = req.body;

  if (!deviceId || !eventId || !reminderDate) {
    return res.status(400).json({
      error: "Missing required fields: deviceId, eventId, reminderDate",
    });
  }

  try {
    // Here you can store reminder in database if needed
    // For now, just acknowledge the reminder was received
    // The actual notification scheduling is handled on the client side

    return res.json({
      success: true,
      message: "Reminder set successfully",
      data: {
        deviceId,
        eventId,
        eventTitle,
        reminderDate,
      },
    });
  } catch (err) {
    console.error("Error setting reminder:", err);
    return res.status(500).json({
      error: "Failed to set reminder",
      message: err.message,
    });
  }
};

// Optional: Add endpoint to get reminders for a device
const getReminders = async (req, res) => {
  const { deviceId } = req.params;

  if (!deviceId) {
    return res.status(400).json({
      error: "Device ID is required",
    });
  }

  try {
    // Fetch reminders from database for this device
    // Implementation depends on your database schema

    return res.json({
      deviceId,
      reminders: [], // Replace with actual data
    });
  } catch (err) {
    console.error("Error fetching reminders:", err);
    return res.status(500).json({
      error: "Failed to fetch reminders",
      message: err.message,
    });
  }
};

module.exports = {
  searchEvents,
  setReminder,
  getReminders,
};
