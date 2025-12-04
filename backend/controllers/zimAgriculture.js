const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");
const { Event } = require("../models/events");
const redis = require("../utils/cache");

const agricultureZimbabweUrl = "https://agriculture.co.zw/events/";

const scrapeAgricultureZimbabwe = async (req, res) => {
  try {
    const response = await axios.get(agricultureZimbabweUrl);
    const $ = cheerio.load(response.data);
    const events = [];

    $(".drts-view-entity-container").each((_, el) => {
      const title = $(el)
        .find('[data-name="entity_field_post_title"] a')
        .text()
        .trim();

      const link = $(el)
        .find('[data-name="entity_field_post_title"] a')
        .attr("href");

      const startDateRaw = $(el)
        .find('[data-name="entity_field_field_start_date"] time')
        .attr("datetime");

      const endDateRaw = $(el)
        .find('[data-name="entity_field_field_end_date"] time')
        .attr("datetime");

      const location = $(el)
        .find(
          '[data-name="entity_field_location_address"] .drts-location-address'
        )
        .text()
        .trim();

      const image = $(el)
        .find('[data-name="entity_field_directory_photos"] img')
        .attr("src");

      const startDate = dayjs(startDateRaw).format("ddd, D MMM");
      const endDate = dayjs(endDateRaw).format("ddd, D MMM");
      const dateRaw = dayjs(startDateRaw).format("DD/MM/YYYY");
      const source = agricultureZimbabweUrl;

      events.push({
        title,
        date: `${startDate} - ${endDate}`, // Display date
        dateRaw, // Formatted as dd/mm/yyyy for sorting
        startDateRaw,
        endDateRaw,
        startDate,
        endDate,
        location,
        link,
        image,
        source,
        sortDate: dayjs(dateRaw, "DD/MM/YYYY").toDate(),
      });
    });

    // Sort by date
    events.sort((a, b) => a.sortDate - b.sortDate);

    if (res) {
      res.status(200).json(events);
    } else {
      return events;
    }
  } catch (error) {
    console.error("Scraping agriculture events failed:", error.message);
    if (res) {
      return res.status(500).json({ error: error.message });
    } else {
      return null;
    }
  }
};

const getZimAgricEvents = async (req, res) => {
  try {
    const cachedEvents = await redis.get("latestEvents");

    if (cachedEvents) {
      const allCachedEvents = JSON.parse(cachedEvents);

      const cachedZimAgricEvents = allCachedEvents.filter(
        (event) => event.source === agricultureZimbabweUrl
      );

      return res.status(200).json(cachedZimAgricEvents);
    }

    const events = await Event.findAll({
      where: {
        source: agricultureZimbabweUrl,
      },
      order: [["dateRaw", "ASC"]],
    });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { scrapeAgricultureZimbabwe, getZimAgricEvents };
