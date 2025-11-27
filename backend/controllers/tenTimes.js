const axios = require("axios");
const puppeteer = require("puppeteer");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
dayjs.extend(isSameOrAfter);

const Ten10TimesUrl = "https://10times.com/zimbabwe";

const scrape10TimesEvents = async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    await page.goto(Ten10TimesUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await page.waitForSelector("tr.event-card");

    const rawResults = await page.evaluate(() => {
      const rows = document.querySelectorAll("tr.event-card");
      const results = [];

      rows.forEach((card) => {
        try {
          // Extract event name
          const nameElement = card.querySelector("h2 span span");
          const name = nameElement ? nameElement.textContent.trim() : "";

          // Extract edition
          const editionElement = card.querySelector(".text-primary small");
          const edition = editionElement
            ? editionElement.textContent.trim()
            : "";

          // Extract date
          const dateElement = card.querySelector(
            ".small.fw-500[data-start-date]"
          );
          const date = dateElement ? dateElement.textContent.trim() : "";
          const startDate = dateElement
            ? dateElement.getAttribute("data-start-date")
            : "";
          const endDate = dateElement
            ? dateElement.getAttribute("data-end-date")
            : "";

          // Extract location
          const venueElement = card.querySelector(".venue");
          const location = venueElement ? venueElement.textContent.trim() : "";

          // Extract description
          const descElement = card.querySelector(".small.text-wrap");
          const description = descElement ? descElement.textContent.trim() : "";

          // Extract event type and category
          const tags = [];
          card.querySelectorAll(".bg-light.rounded-1").forEach((tag) => {
            tags.push(tag.textContent.trim());
          });

          // Extract event URL
          const linkElement = card.querySelector("[data-id]");
          const eventId = linkElement
            ? linkElement.getAttribute("data-id")
            : "";
          const eventUrl = linkElement
            ? linkElement.getAttribute("data-url")
            : "";

          // Extract interested count
          const interestedElement = card.querySelector(
            ".fw-500.text-decoration-none span"
          );
          const interestedCount = interestedElement
            ? interestedElement.textContent.trim()
            : "0";

          results.push({
            title: name,
            date: date,
            startDateRaw: startDate,
            endDateRaw: endDate,
            location: location,
            description: description,
            link: eventUrl,
          });
        } catch (error) {
          console.error("Error parsing event card:", error);
        }
      });

      return results;
    });

    const today = dayjs().startOf("day");

    const events = rawResults
      .map((e) => {
        const start = dayjs(e.startDateRaw);
        const end = dayjs(e.endDateRaw);

        return {
          title: e.title,
          dateRaw: e.startDateRaw,
          date: `${start.format("ddd, D MMM")} - ${end.format("ddd, D MMM")}`,
          location: e.location,
          link: e.link,
          description: e.description,
          sortDate: start.toDate(),
          source: Ten10TimesUrl,
        };
      })
      .filter((event) => dayjs(event.dateRaw).isSameOrAfter(today))
      .sort((a, b) => a.sortDate - b.sortDate);

    await browser.close();

    if (res) {
      return res.status(200).json(events);
    } else {
      return events;
    }
  } catch (err) {
    console.error("Error in 10Times scraper:", err.message);
    if (res) {
      return res.status(500).json({ error: err.message });
    }
    return [];
  }
};

module.exports = { scrape10TimesEvents };
