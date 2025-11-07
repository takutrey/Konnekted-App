const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");

const motorsportsZimbabweUrl = "https://www.motorsportzimbabwe.co.zw/events/";

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
      const dateRaw = $(el).find(".wpem-event-date-time-text").text().trim();
      const location = $(el).find(".wpem-event-location-text").text().trim();

      const date = dayjs(dateRaw).format("ddd, D MMM");
      const source = motorsportsZimbabweUrl;

      events.push({
        title,
        dateRaw,
        date,
        location,
        link,
        source,
      });
    });

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

module.exports = { scrapeMotorsportsZimbabwe };
