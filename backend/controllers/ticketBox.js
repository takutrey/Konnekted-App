const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");

const ticketboxUrl = "https://www.ticketbox.co.zw/shows";

const scrapeTicketbox = async (req, res) => {
  try {
    const { data } = await axios.get(ticketboxUrl);
    const $ = cheerio.load(data);
    const events = [];

    $("li[data-hook='side-by-side-item']").each((_, el) => {
      const title = $(el).find("a[data-hook='title']").text().trim();
      const date = $(el).find("[data-hook='short-date']").text().trim();
      const description = $(el).find(".PLst2a").text().trim();
      const link = $(el).find("a[data-hook='title']").attr("href");
      const fullLink = link?.startsWith("http")
        ? link
        : `https://www.ticketbox.co.zw${link}`;
      const image = $(el).find("img").attr("src");

      const dateRaw = date;
      const source = ticketboxUrl;

      events.push({
        title,
        dateRaw,
        date,
        description,
        link: fullLink,
        image,
        source,
      });
    });

    if (res) {
      res.status(200).json(events);
    } else {
      return events;
    }
  } catch (err) {
    console.error("Scraping failed:", err.message);
    return [];
  }
};

module.exports = { scrapeTicketbox };
