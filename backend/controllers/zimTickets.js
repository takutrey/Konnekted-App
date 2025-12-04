const puppeteer = require("puppeteer");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const { Event } = require("../models/events");
const redis = require("../utils/cache");

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);

const zimTicketsUrl = "https://www.zimtickets.com/explore/music";

const scrapeZimTickets = async (req, res) => {
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

    await page.goto(zimTicketsUrl, {
      waitUntil: "networkidle2",
      timeout: 120000,
    });

    // Wait for event cards to load
    await page.waitForSelector(".rounded-lg.bg-slate-50", {
      timeout: 30000,
    });

    const events = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll(".rounded-lg.bg-slate-50")
      );

      return cards
        .map((card) => {
          try {
            // Extract date (day and month from overlay)
            const dayElement = card.querySelector(
              ".bg-\\[\\#222226\\]\\/50 h3"
            );
            const monthElement = card.querySelector(".bg-\\[\\#111\\]\\/70 h6");
            const day = dayElement ? dayElement.textContent.trim() : "";
            const month = monthElement ? monthElement.textContent.trim() : "";

            // Extract title
            const titleElement = card.querySelector(
              "a.text-\\[16px\\].font-semibold"
            );
            const title = titleElement ? titleElement.textContent.trim() : "";

            // Skip events without titles
            if (!title) {
              return null;
            }

            // Extract description (first paragraph after title)
            const descElements = card.querySelectorAll("p.text-neutral-500");
            let description = "";
            if (descElements.length > 0) {
              // Usually the first p.text-neutral-500 after the title is the description
              for (let p of descElements) {
                const text = p.textContent.trim();
                if (text && !text.includes("Venue:") && text.length > 20) {
                  description = text;
                  break;
                }
              }
            }

            // Extract location (from venue)
            const venueElements = card.querySelectorAll(
              "p.text-neutral-500.text-\\[12px\\]"
            );
            let location = "";
            for (let p of venueElements) {
              const text = p.textContent.trim();
              if (text.includes("Venue:")) {
                location = text.replace("Venue:", "").trim();
                break;
              }
            }

            // Extract image
            const imgElement = card.querySelector("img");
            const image = imgElement ? imgElement.src : "";

            // Extract link
            const linkElement = card.querySelector(
              "a.text-\\[16px\\].font-semibold"
            );
            const relativeLink = linkElement
              ? linkElement.getAttribute("href")
              : "";
            const link = relativeLink
              ? `https://www.zimtickets.com${relativeLink}`
              : "";

            // Extract price if available (check for "View" button or similar)
            let price = "";
            const viewButton = card.querySelector(
              "a.border-transparent.text-\\[\\#ff2960\\]"
            );
            if (viewButton) {
              price = "Tickets Available";
            }

            return {
              title,
              day,
              month,
              description,
              location,
              price,
              image,
              link,
            };
          } catch (error) {
            console.error("Error parsing event card:", error);
            return null;
          }
        })
        .filter((event) => event !== null && event.title); // Filter null and empty titles
    });

    // Get today's date for filtering
    const today = dayjs().startOf("day");
    const currentYear = today.year();

    // Parse and format dates
    const parsedEvents = events
      .map((event) => {
        let parsedDate = null;
        let formattedDate = null;
        let dateRaw = "";
        let sortDate = null;
        let hasValidDate = false;

        if (event.day && event.month) {
          try {
            // Create date string with current year
            const dateString = `${event.day} ${event.month} ${currentYear}`;

            // Try different date formats
            let parsed = dayjs(dateString, "D MMM YYYY");

            if (!parsed.isValid()) {
              // Try with month abbreviations that might be different
              parsed = dayjs(dateString, "D MMM YYYY", true);
            }

            if (!parsed.isValid()) {
              // Try with full month names
              parsed = dayjs(dateString, "D MMMM YYYY");
            }

            if (parsed.isValid()) {
              parsedDate = parsed;
              hasValidDate = true;
              formattedDate = parsed.format("ddd, D MMM YYYY");
              // Format as dd/mm/yyyy
              dateRaw = parsed.format("DD/MM/YYYY");
              sortDate = parsed.valueOf(); // Store timestamp for sorting
            }
          } catch (error) {
            console.error(
              `Date parsing error for: ${event.day} ${event.month}`,
              error
            );
          }
        }

        // If no valid date, use a future date for sorting
        if (!sortDate) {
          sortDate = dayjs().add(10, "year").valueOf(); // Far future for events without dates
        }

        return {
          title: event.title,
          date: formattedDate || "Date TBA",
          dateRaw: dateRaw,
          location: event.location || "Location TBA",
          price: event.price || "Check Website",
          image: event.image,
          link: event.link || zimTicketsUrl,
          source: zimTicketsUrl,
          rawDate: `${event.day} ${event.month}`, // Keep original for debugging
          sortDate: sortDate, // Add this for sorting
          hasValidDate: hasValidDate, // Track if we have a valid date
        };
      })
      // Filter out past events and events without valid dates
      .filter((event) => {
        // Skip events without valid dates
        if (!event.hasValidDate) {
          return false;
        }

        // Check if date is today or in future
        return dayjs(event.sortDate).isSameOrAfter(today, "day");
      })
      // Sort by date (ascending - soonest first)
      .sort((a, b) => {
        return a.sortDate - b.sortDate;
      });

    // Response handling
    if (res) {
      return res.status(200).json(parsedEvents);
    } else {
      return parsedEvents;
    }
  } catch (error) {
    console.error("Puppeteer error:", error.message);
    console.error("Error stack:", error.stack);

    if (res) {
      return res.status(500).json({ error: error.message });
    }
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const getZimTicketsEvents = async (req, res) => {
  try {
    const cachedEvents = await redis.get("latestEvents");

    if (cachedEvents) {
      const allCachedEvents = JSON.parse(cachedEvents);
      const zimTicketsCachedEvents = allCachedEvents.filter(
        (event) => event.source === zimTicketsUrl
      );

      return res.status(200).json(zimTicketsCachedEvents);
    }

    const events = await Event.findAll({
      where: {
        source: zimTicketsUrl,
      },
      order: [
        ["date", "ASC"],
        ["dateRaw", "ASC"],
      ],
    });

    return res.status(200).json(events);
  } catch (error) {
    console.error("Error getting ZimTickets events:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { scrapeZimTickets, getZimTicketsEvents };
