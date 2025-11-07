const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");

const AllEventsUrl = "https://allevents.in/harare/all";

const scrapeAllEvents = async (req, res) => {
  try {
    const { data } = await axios.get(AllEventsUrl);
    const $ = cheerio.load(data);

    const events = [];

    $(".event-card").each((_, el) => {
      const title = $(el).find(".meta .title").text().trim();
      const dateRaw = $(el).find(".meta-bottom .date").first().text().trim();
      const date = dayjs(dateRaw).format("ddd, D MMM");
      const location = $(el).find(".meta .subtitle").text().trim();
      const link = "https://allevents.in/" + $(el).find("a").attr("href");

      const bannerStyle = $(el).find(".banner-cont").attr("style");
      let imageUrl = null;

      const match = bannerStyle?.match(/url\((.*?)\)/);
      if (match && match[1]) {
        imageUrl = match[1].replace(/^['"]|['"]$/g, "");
      }

      const image = imageUrl;
      const source = AllEventsUrl;

      events.push({ title, date, dateRaw, location, link, image, source });
    });
    if (res) {
      res.status(200).json(events);
    } else {
      return events;
    }
  } catch (error) {
    console.error("Scraping error:", error.message);
  }
};

module.exports = { scrapeAllEvents };
