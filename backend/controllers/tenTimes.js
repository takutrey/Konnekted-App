const axios = require("axios");
const puppeteer = require("puppeteer");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
dayjs.extend(isSameOrAfter);

const Ten10TimesUrl = "https://10times.com/zimbabwe";

const scrape10TimesEvents = async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    await page.goto(Ten10TimesUrl, { waitUntil: "networkidle2", timeout: 0 });
    await page.waitForSelector("tr.event-card");

    const rawResults = await page.evaluate(() => {
      const rows = document.querySelectorAll("tr.event-card");
      const results = [];

      rows.forEach((el) => {
        const title =
          el.querySelector("h2 span.d-block")?.innerText.trim() || "";
        const dateElement = el.querySelector("[data-start-date]");
        const startDateRaw = dateElement?.getAttribute("data-start-date") || "";
        const endDateRaw = dateElement?.getAttribute("data-end-date") || "";
        const location =
          el.querySelector(".venue")?.innerText.replace(/\s+/g, " ").trim() ||
          "";

        const onclickAttr =
          el.querySelector("td.show-related")?.getAttribute("onclick") || "";
        const linkMatch = onclickAttr.match(/window\.open\('(.*?)'/);
        const link = linkMatch ? linkMatch[1] : "https://10times.com/zimbabwe";

        results.push({
          title,
          startDateRaw,
          endDateRaw,
          location,
          link,
        });
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
          date: `${start.format("dd, D MMM")} - ${end.format("dd, D MMM")}`,
          location: e.location,
          link: e.link,
          sortDate: start.toDate(),
          source: Ten10TimesUrl,
        };
      })
      .filter((event) => dayjs(event.dateRaw).isSameOrAfter(today)); // ✨ Filter future events only

    await browser.close();

    if (res) {
      return res.status(200).json(events);
    } else {
      return events;
    }
  } catch (err) {
    console.error("Error in scraper:", err.message);
    if (res) {
      return res.status(500).json({ error: err.message });
    }
    return [];
  }
};

module.exports = { scrape10TimesEvents };
