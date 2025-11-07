const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");

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
      const source = agricultureZimbabweUrl;

      events.push({
        title,
        dateRaw: startDateRaw,
        startDateRaw,
        endDateRaw,
        startDate,
        endDate,
        location,
        link,
        image,
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

module.exports = { scrapeAgricultureZimbabwe };
