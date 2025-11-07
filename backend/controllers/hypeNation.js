const puppeteer = require("puppeteer");
const axios = require("axios");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const hypeNationUrl = "https://tickets.hypenation.co.zw/tickets";

const scrapeHypeNation = async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(hypeNationUrl, {
      waitUntil: "networkidle2",
      timeout: 120000,
    });

    // Wait for active events section to load
    await page.waitForSelector(
      'hypenation-tickets-events-list[title="Active Events"]',
      { timeout: 15000 }
    );

    const events = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll(
          'hypenation-tickets-events-list[title="Active Events"] hypenation-tickets-event-card'
        )
      );

      return cards.map((card) => {
        const getCleanText = (selector) =>
          card.querySelector(selector)?.textContent?.trim() || "N/A";

        return {
          title: getCleanText(".text-md.font-bold"),
          dateRaw: getCleanText(
            ".flex.gap-4.items-center .text-sm.text-gray-600"
          ).replace(/\s+/g, " "),

          location: getCleanText(".text-sm.text-gray-600"),
          price: getCleanText("span.absolute.right-2.top-2"),
          image: card.querySelector("img")?.src || "",
          link: "https://tickets.hypenation.co.zw/tickets",
          source: "https://tickets.hypenation.co.zw/tickets",
        };
      });
    });

    await browser.close();
    const parsedEvents = events
      .filter((event) => event.title !== "N/A" && event.dateRaw.includes("-"))
      .map((event) => {
        const [datePart, timePart] = event.dateRaw.split(" - ");
        const parsed = dayjs(`${datePart} ${timePart}`, "DD/MM/YYYY HH:mm");

        return {
          ...event,
          date: parsed.format("ddd, D MMM"), // "Thu, 23 Jul"
          time: parsed.format("HH:mm"), // "06:30"
        };
      });
    if (res) {
      return res.status(200).json(parsedEvents);
    } else {
      return parsedEvents;
    }
  } catch (error) {
    await browser.close();
    console.error("Puppeteer error:", error.message);
    return [];
  }
};

module.exports = { scrapeHypeNation };
