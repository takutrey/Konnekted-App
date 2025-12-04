const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");
const { Event } = require("../models/events");
const redis = require("../utils/cache");

const motorsportsZimbabweUrl = "https://motorsportzimbabwe.co.zw/events/";

function parseMotorsportDate(dateRaw) {
  if (!dateRaw) return null;

  const cleaned = dateRaw.replace(/\s+/g, " ").trim();

  // Case 1: Date range "2025-11-21 - 2025-11-23"
  if (cleaned.includes(" - ")) {
    const [startRaw] = cleaned.split(" - ").map((s) => s.trim());
    const start = dayjs(startRaw);

    if (start.isValid()) {
      return start.format("DD/MM/YYYY");
    }
  }

  // Case 2: "2025-11-02 @ 07:00 AM"
  const [datePart] = cleaned.split("@").map((s) => s.trim());
  const parsed = dayjs(datePart);

  if (parsed.isValid()) {
    return parsed.format("DD/MM/YYYY");
  }

  return null;
}

const scrapeMotorsportsZimbabwe = async (req, res) => {
  try {
    const response = await axios.get(motorsportsZimbabweUrl);
    const $ = cheerio.load(response.data);
    const events = [];

    $(".wpem-event-box-col").each((_, el) => {
      const link =
        $(el).find("a.wpem-event-action-url").first().attr("href")?.trim() ||
        "";
      const title = $(el).find("h3.wpem-heading-text").text().trim();
      const dateStr = $(el).find(".wpem-event-date-time-text").text().trim();
      const location = $(el).find(".wpem-event-location-text").text().trim();

      const dateRaw = parseMotorsportDate(dateStr);
      const source = motorsportsZimbabweUrl;

      if (title && dateRaw) {
        events.push({
          title,
          date: dateStr, // Original date string for display
          dateRaw, // Formatted as dd/mm/yyyy for sorting
          location,
          link,
          source,
          sortDate: dayjs(dateRaw, "DD/MM/YYYY").toDate(),
        });
      }
    });

    // Sort by date
    events.sort((a, b) => a.sortDate - b.sortDate);

    if (res) {
      res.status(200).json(events);
    } else {
      return events;
    }
  } catch (error) {
    console.error("Scraping motorsports failed:", error.message);
    if (res) {
      return res.status(500).json({ error: error.message });
    } else {
      return null;
    }
  }
};

const getMotorsportEvents = async (req, res) => {
  try {
    const cachedEvents = await redis.get("latestEvents");

    if (cachedEvents) {
      const allCachedEvents = JSON.parse(cachedEvents);

      const cachedMotorsportEvents = allCachedEvents.filter(
        (event) => event.source === motorsportsZimbabweUrl
      );

      return res.status(200).json(cachedMotorsportEvents);
    }

    const events = await Event.findAll({
      where: {
        source: motorsportsZimbabweUrl,
      },
      order: [["dateRaw", "ASC"]],
    });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { scrapeMotorsportsZimbabwe, getMotorsportEvents };
