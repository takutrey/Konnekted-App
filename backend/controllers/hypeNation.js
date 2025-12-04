const puppeteer = require("puppeteer");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const { Event } = require("../models/events");
const redis = require("../utils/cache");
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);

const hypeNationUrl = "https://tickets.hypenation.co.zw/tickets";

const scrapeHypeNation = async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set viewport and realistic user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    await page.goto(hypeNationUrl, {
      waitUntil: "networkidle2",
      timeout: 120000,
    });

    // Wait for event cards to load
    await page.waitForSelector("hypenation-tickets-event-card", {
      timeout: 30000,
    });

    const events = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll("hypenation-tickets-event-card")
      );

      return cards
        .map((card) => {
          try {
            // Extract title
            const titleElement = card.querySelector(".text-md.font-bold");
            const title = titleElement ? titleElement.textContent.trim() : "";

            // Extract date and time
            const dateElements = card.querySelectorAll(
              ".text-sm.text-gray-600"
            );
            let dateStr = "";
            let location = "";

            if (dateElements.length > 0) {
              // First .text-sm.text-gray-600 contains the date
              dateStr = dateElements[0].textContent.trim();

              // Second .text-sm.text-gray-600 contains the location
              if (dateElements.length > 1) {
                location = dateElements[1].textContent.trim();
              }
            }

            // Extract price
            const priceElement = card.querySelector(
              ".absolute.right-2.top-2.z-10"
            );
            const price = priceElement ? priceElement.textContent.trim() : "";

            // Extract image
            const imgElement = card.querySelector("img");
            const image = imgElement ? imgElement.src : "";
            const altText = imgElement ? imgElement.alt : "";

            return {
              title: title || altText,
              dateStr,
              location,
              price,
              image,
            };
          } catch (error) {
            console.error("Error parsing event card:", error);
            return null;
          }
        })
        .filter((event) => event !== null);
    });

    console.log(`Found ${events.length} raw events`);

    // Get today's date for filtering
    const today = dayjs().startOf("day");

    // Parse and format dates
    const parsedEvents = events
      .map((event) => {
        let parsedDate = null;
        let formattedDate = null;
        let dateRaw = null;
        let time = null;

        if (event.dateStr && event.dateStr.includes("-")) {
          try {
            // Split date and time: "2025-11-30 - 05:30"
            const parts = event.dateStr.split(" - ");
            if (parts.length === 2) {
              const datePart = parts[0].trim();
              const timePart = parts[1].trim();

              // Parse the date
              const parsed = dayjs(
                `${datePart} ${timePart}`,
                "YYYY-MM-DD HH:mm"
              );

              if (parsed.isValid()) {
                parsedDate = parsed;
                formattedDate = parsed.format("ddd, D MMM YYYY");
                dateRaw = parsed.format("DD/MM/YYYY");
                time = parsed.format("HH:mm");
              }
            }
          } catch (error) {
            console.error(`Date parsing error for: ${event.dateStr}`, error);
          }
        }

        return {
          title: event.title,
          date: formattedDate,
          dateRaw, // Formatted as dd/mm/yyyy for sorting
          time: time,
          location: event.location,
          price: event.price,
          image: event.image,
          link: hypeNationUrl,
          source: hypeNationUrl,
          sortDate: parsedDate ? parsedDate.toDate() : null,
        };
      })
      // Filter out events without valid dates and past events
      .filter((event) => {
        if (!event.sortDate) return false;
        return dayjs(event.sortDate).isSameOrAfter(today);
      })
      // Sort by date
      .sort((a, b) => a.sortDate - b.sortDate);

    // Response handling
    if (res) {
      return res.status(200).json(parsedEvents);
    } else {
      return parsedEvents;
    }
  } catch (error) {
    console.error("Puppeteer error:", error.message);
    if (res) {
      return res.status(500).json({ error: error.message });
    }
    return [];
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
};

const getHypeNationEvents = async (req, res) => {
  try {
    const cachedEvents = await redis.get("latestEvents");

    if (cachedEvents) {
      const allCachedEvents = JSON.parse(cachedEvents);

      const hypeNationCachedEvents = allCachedEvents.filter(
        (event) => event.source === hypeNationUrl
      );

      return res.status(200).json(hypeNationCachedEvents);
    }
    const events = await Event.findAll({
      where: {
        source: hypeNationUrl,
      },
      order: [["dateRaw", "ASC"]],
    });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { scrapeHypeNation, getHypeNationEvents };
