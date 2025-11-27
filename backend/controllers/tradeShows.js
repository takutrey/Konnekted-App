const axios = require("axios");
const cheerio = require("cheerio");

const scrapeEventsEye = async (req, res) => {
  const url = "https://www.eventseye.com/fairs/c1_trade-shows_zimbabwe.html";
  const sourceUrl = "https://www.eventseye.com";

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

      const date = $(el).find("td").eq(3).text().trim();
      const source = url;

      if (title) {
        events.push({
          title,
          description,
          link,
          location,
          venue,
          date,
          category: "trade shows",
          source: sourceUrl,
        });
      }
    });

    if (res) {
      return res.status(200).json(events);
    } else {
      return events;
    }
  } catch (error) {
    console.error("Scraping Mine-Entra failed:", error.message);
    if (res) {
      return res.status(500).json({ error: error.message });
    } else {
      return null;
    }
  }
};

module.exports = { scrapeEventsEye };
