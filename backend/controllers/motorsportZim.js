const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");

const motorsportsZimbabweUrl = "https://motorsportzimbabwe.co.zw/events/";

function parseMotorsportDate(dateRaw) {
  if (!dateRaw) return null;

  const cleaned = dateRaw.replace(/\s+/g, " ").trim();

  // Case 1: Date range "2025-11-21 - 2025-11-23"
  if (cleaned.includes(" - ")) {
    const [startRaw, endRaw] = cleaned.split(" - ").map((s) => s.trim());
    const start = dayjs(startRaw);
    const end = dayjs(endRaw);

    if (start.isValid() && end.isValid()) {
      return {
        startDate: start.format("YYYY-MM-DD"),
        endDate: end.format("YYYY-MM-DD"),
        display: `${start.format("D MMM YYYY")} - ${end.format("D MMM YYYY")}`,
      };
    }
  }

  // Case 2: "2025-11-02 @ 07:00 AM"
  const [datePart, timePart] = cleaned.split("@").map((s) => s.trim());
  const parsed = dayjs(`${datePart} ${timePart || ""}`);

  if (parsed.isValid()) {
    return {
      startDate: parsed.format("YYYY-MM-DD"),
      endDate: null,
      display: parsed.format("D MMM"),
    };
  }

  return { startDate: null, endDate: null, display: null };
}

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

      const parsedDate = parseMotorsportDate(dateRaw);
      const date = parsedDate;
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

scrapeMotorsportsZimbabwe();

module.exports = { scrapeMotorsportsZimbabwe };
