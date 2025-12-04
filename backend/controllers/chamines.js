const cheerio = require("cheerio");
const axios = require("axios");
const dayjs = require("dayjs");
const { Event } = require("../models/events");
const redis = require("../utils/cache");

const chaminesUrl = "https://www.chamines.co.zw/home/Events";

const scrapeChamines = async (req, res) => {
  try {
    const response = await axios.get(chaminesUrl);
    const $ = cheerio.load(response.data);
    const events = [];

    $(".accordion.block").each((_, el) => {
      const content = $(el).find(".acc-content .content");

      const rawTitle = $(el).find(".acc-btn").text().trim();
      const title = rawTitle.split(" - ")[0];

      const dateText = content
        .find("h5:contains('Date')")
        .next("h5")
        .text()
        .trim();
      const [startDateStr] = dateText.split("-").map((d) => d.trim());

      let dateRaw = null;
      try {
        // Try to parse various date formats
        const parsed = dayjs(startDateStr);
        if (parsed.isValid()) {
          dateRaw = parsed.format("DD/MM/YYYY");
        }
      } catch (e) {
        console.error(`Date parsing error: ${startDateStr}`, e);
      }

      const date = dayjs(startDateStr).format("ddd, D MMM");
      const source = chaminesUrl;

      const location = content
        .find("h5:contains('Venue')")
        .next("h5")
        .text()
        .trim();

      const image =
        "https://img.freepik.com/premium-vector/upcoming-events-speech-bubble-banner-with-upcoming-events-text-glassmorphism-style-business-marketing-advertising-vector-isolated-background-eps-10_399089-2079.jpg";
      const link = chaminesUrl;

      if (title && dateRaw) {
        events.push({
          title,
          date, // Display date
          dateRaw, // Formatted as dd/mm/yyyy for sorting
          location,
          link,
          image,
          source: chaminesUrl,
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
  } catch (err) {
    console.error("Scraping failed:", err.message);
    if (res) {
      return res.status(500).json({ error: err.message });
    } else {
      return null;
    }
  }
};

const getChaminesEvents = async (req, res) => {
  try {
    const cachedEvents = await redis.get("latestEvents");

    if (cachedEvents) {
      const allCachedEvents = JSON.parse(cachedEvents);

      const cachedChaminesEvents = allCachedEvents.filter(
        (event) => event.source === chaminesUrl
      );

      return res.status(200).json(cachedChaminesEvents);
    }

    const events = await Event.findAll({
      where: {
        source: chaminesUrl,
      },
      order: [["dateRaw", "ASC"]],
    });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { scrapeChamines, getChaminesEvents };
