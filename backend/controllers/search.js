const { Op } = require("sequelize");
const Event = require("../models/events");

const searchEvents = async (req, res) => {
  const { search = "", minPrice, maxPrice, startDate, endDate } = req.query;

  const where = {};

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.price[Op.lte] = [parseFloat(maxPrice)];
  }

  if (startDate || endDate) {
    where.dateRaw = {};
    if (startDate) where.dateRaw[Op.gte] = new Date(startDate);
    if (endDate) where.dateRaw[Op.lte] = new Date(endDate);
  }

  try {
    const events = await Event.findAll({
      where,
      order: [["dateRaw", "ASC"]],
    });

    return res.json(events.map((e) => e.toJSON()));
  } catch (err) {
    console.error("Error fetching filtered events:", err);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
};

module.exports = { searchEvents };
