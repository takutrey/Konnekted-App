const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");
const { Event } = require("../models/events");
const redis = require("../utils/cache");

const sourceUrl = "https://www.eventseye.com";

// Helper function to parse Eventseye dates
function parseEventseyeDate(dateStr) {
  if (!dateStr) return null;

  // Eventseye dates can be in various formats like:
  // "2025-10-21 - 2025-10-24"
  // "2025-12-04"
  // "2025-07-01 - 2025-07-02"

  const dateMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const parsed = dayjs(dateMatch[1], "YYYY-MM-DD");
    if (parsed.isValid()) {
      return parsed.format("DD/MM/YYYY");
    }
  }

  return null;
}

const scrapeEventsEye = async (req, res) => {
  const url = "https://www.eventseye.com/fairs/c1_trade-shows_zimbabwe.html";

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const events = [];

    $("tr").each((_, el) => {
      const titleLink = $(el).find("td").eq(0).find("a");
      const title = titleLink.find("b").text().trim();
      const description = titleLink.find("i").text().trim();
      const link = titleLink.attr("href")
        ? `https://www.eventseye.com/fairs/${titleLink.attr("href")}`
        : "";

      const locationTd = $(el).find("td").eq(2);
      const location = locationTd.find("a").eq(0).text().trim();
      const venue = locationTd.find("a").eq(1).text().trim();

      const dateStr = $(el).find("td").eq(3).text().trim();
      const dateRaw = parseEventseyeDate(dateStr);
      const source = url;

      if (title) {
        events.push({
          title,
          description,
          link,
          location,
          venue,
          date: dateStr, // Original date string for display
          dateRaw, // Formatted as dd/mm/yyyy for sorting
          category: "trade shows",
          source: sourceUrl,
          sortDate: dayjs(dateRaw, "DD/MM/YYYY").toDate(),
        });
      }
    });

    // Sort by date
    events.sort((a, b) => a.sortDate - b.sortDate);

    if (res) {
      return res.status(200).json(events);
    } else {
      return events;
    }
  } catch (error) {
    console.error("Scraping Eventseye failed:", error.message);
    if (res) {
      return res.status(500).json({ error: error.message });
    } else {
      return null;
    }
  }
};

const getTradeShowsEvents = async (req, res) => {
  try {
    const cachedEvents = await redis.get("latestEvents");

    if (cachedEvents) {
      const allCachedEvents = JSON.parse(cachedEvents);

      const cachedTradeShowsEvents = allCachedEvents.filter(
        (event) => event.source === sourceUrl
      );

      return res.status(200).json(cachedTradeShowsEvents);
    }

    const events = await Event.findAll({
      where: {
        source: sourceUrl,
      },
      order: [["dateRaw", "ASC"]],
    });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { scrapeEventsEye, getTradeShowsEvents };
