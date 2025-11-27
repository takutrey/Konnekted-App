const cheerio = require("cheerio");
const axios = require("axios");
const dayjs = require("dayjs");

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
      const [startDate, endDate] = dateText.split("-").map((d) => d.trim());
      const dateRaw = startDate;
      const date = dayjs(dateRaw).format("ddd, D MMM");
      const source = chaminesUrl;

      const location = content
        .find("h5:contains('Venue')")
        .next("h5")
        .text()
        .trim();

      const image =
        "https://img.freepik.com/premium-vector/upcoming-events-speech-bubble-banner-with-upcoming-events-text-glassmorphism-style-business-marketing-advertising-vector-isolated-background-eps-10_399089-2079.jpg";
      const link = chaminesUrl;

      events.push({
        title,
        date,
        dateRaw,
        location,
        link,
        image,
        source: chaminesUrl,
      });
    });

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

module.exports = { scrapeChamines };
