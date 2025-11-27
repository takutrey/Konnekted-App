const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");

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

        const dateRaw = $(el).find(".meta-top .date").text().trim();
        const date = dayjs(dateRaw, "ddd, DD MMM, YYYY - hh:mm A").isValid()
          ? dayjs(dateRaw, "ddd, DD MMM, YYYY - hh:mm A").format(
              "ddd, D MMM YYYY - hh:mm A"
            )
          : null;

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

        events.push({
          eventId,
          title,
          dateRaw,
          date,
          location,
          link,
          image,
          source: sourceUrl,
        });
      });
    }

    if (res) return res.status(200).json(events);

    return events;
  } catch (err) {
    console.error("Scraping error:", err.message);
    if (res) return res.status(500).json({ error: err.message });
  }
};

module.exports = { scrapeAllEvents };
