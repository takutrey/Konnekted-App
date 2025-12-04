const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");
const { Event } = require("../models/events");
const redis = require("../utils/cache");

const AllEventsUrls = [
  "https://allevents.in/harare/all",
  "https://allevents.in/chitungwiza/all",
  "https://allevents.in/bulawayo/all",
  "https://allevents.in/beitbridge/all",
  "https://allevents.in/marondera/all",
  "https://allevents.in/mutare",
  "https://allevents.in/victoria-falls/all",
];

const sourceUrl = "https://allevents.in";

const scrapeAllEvents = async (req, res) => {
  try {
    const events = [];

    // Run all URLs at once
    const requests = AllEventsUrls.map((url) => axios.get(url));
    const responses = await Promise.all(requests);

    for (let i = 0; i < responses.length; i++) {
      const url = AllEventsUrls[i];
      const data = responses[i].data;

      const $ = cheerio.load(data);

      $(".event-card").each((_, el) => {
        const eventId = $(el).attr("data-eid")?.trim();
        const title = $(el).find(".meta-middle .title h3").text().trim();

        const dateStr = $(el).find(".meta-top .date").text().trim();

        let dateRaw = null;
        let date = null;

        try {
          // Parse AllEvents date format: "Sat, 14 Dec, 2024 - 18:00"
          const parsed = dayjs(dateStr, "ddd, DD MMM, YYYY - HH:mm");

          if (parsed.isValid()) {
            dateRaw = parsed.format("DD/MM/YYYY");
            date = parsed.format("ddd, D MMM YYYY - HH:mm");
          }
        } catch (e) {
          console.error(`Date parsing error: ${dateStr}`, e);
        }

        const location = $(el).find(".meta-middle .location").text().trim();

        // Fix the link
        const href = $(el).find(".meta-middle .title a").attr("href");
        // Extract city name dynamically from URL
        const city = url.split("/")[3] || null;
        const link = href?.startsWith("http")
          ? href
          : `https://allevents.in${href}`;

        // Banner image extraction
        const bannerStyle = $(el).find(".banner-cont").attr("style");
        let image = null;
        if (bannerStyle) {
          const match = bannerStyle.match(/url\((.*?)\)/);
          if (match) image = match[1].replace(/['")]+/g, "");
        }

        if (title) {
          events.push({
            eventId,
            title,
            date, // Formatted display date
            dateRaw, // Formatted as dd/mm/yyyy for sorting
            location,
            link,
            image,
            source: sourceUrl,
            sortDate: dayjs(dateRaw, "DD/MM/YYYY").toDate(),
          });
        }
      });
    }

    // Sort all events by date
    events.sort((a, b) => a.sortDate - b.sortDate);

    if (res) return res.status(200).json(events);

    return events;
  } catch (err) {
    console.error("Scraping error:", err.message);
    if (res) return res.status(500).json({ error: err.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const cachedEvents = await redis.get("latestEvents");

    if (cachedEvents) {
      const allCachedEvents = JSON.parse(cachedEvents);

      const allEventsCached = allCachedEvents.filter(
        (event) => event.source === sourceUrl
      );

      return res.status(200).json(allEventsCached);
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

module.exports = { scrapeAllEvents, getAllEvents };
