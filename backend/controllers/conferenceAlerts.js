const axios = require("axios");
const cheerio = require("cheerio");

const conferenceAlerts = "https://conferencealerts.co.in/zimbabwe";

const scrapeConferenceAlerts = async (req, res) => {
  try {
    const response = await axios.get(conferenceAlerts);
    const $ = cheerio.load(response.data);
    const events = [];

    $("tr.data").each((_, el) => {
      const link = $(el).find("a").first().attr("href")?.trim() || "";
      const title = $(el).find("td").eq(1).find("p").text().trim();
      const date = $(el).find("td").eq(0).find("p").text().trim();
      const location = $(el)
        .find("td")
        .eq(2)
        .find("h4")
        .text()
        .trim()
        .replace(/\s+/g, " ");
      const source = conferenceAlerts;

      events.push({
        title,
        dateRaw: date,
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
    console.error("Scraping conference alerts failed:", error.message);
    if (res) {
      return res.status(500).json({ error: error.message });
    } else {
      return null;
    }
  }
};

module.exports = { scrapeConferenceAlerts };
