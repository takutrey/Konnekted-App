const puppeteer = require("puppeteer");
const dayjs = require("dayjs");
const { Event } = require("../models/events");
const redis = require("../utils/cache");

const ticketboxUrl = "https://www.ticketbox.co.zw/events";

const scrapeTicketbox = async (req, res) => {
  let browser = null;
  try {
    console.log("Launching Puppeteer browser...");

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 1920, height: 1080 },
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log(`Navigating to ${ticketboxUrl}...`);
    await page.goto(ticketboxUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector("body", { timeout: 30000 });

    // Extract events with more specific selectors based on your HTML structure
    const events = await page.evaluate(() => {
      const results = [];

      // Strategy: Look for event cards with the specific structure from your HTML
      // First, find all event containers
      const eventContainers = document.querySelectorAll('a[href*="/events/"]');

      eventContainers.forEach((link) => {
        try {
          // Go up the DOM to find the event card container
          let container = link;
          let eventCard = null;

          // Look for a parent with specific classes or structure
          for (let i = 0; i < 6; i++) {
            container = container.parentElement;
            if (!container) break;

            // Check for classes that might indicate an event card
            const classes = container.className || "";
            if (
              classes.includes("group") ||
              classes.includes("rounded") ||
              classes.includes("border") ||
              (container.querySelector("img") &&
                container.querySelector("h1, h2, h3, h4"))
            ) {
              eventCard = container;
              break;
            }
          }

          // If we found a card-like container, extract data
          if (eventCard) {
            // Extract title - look for h3 with specific classes
            const titleEl =
              eventCard.querySelector("h3.text-xl.font-semibold") ||
              eventCard.querySelector("h3") ||
              eventCard.querySelector("h2, h1, h4");
            const title = titleEl ? titleEl.textContent.trim() : "";

            // Extract date - look for the calendar icon's sibling span
            let date = "";
            const calendarIcon = eventCard.querySelector(".lucide-calendar");
            if (
              calendarIcon &&
              calendarIcon.nextElementSibling &&
              calendarIcon.nextElementSibling.tagName === "SPAN"
            ) {
              date = calendarIcon.nextElementSibling.textContent.trim();
            }

            // If not found by icon, look for date text
            if (!date) {
              const dateSpans = eventCard.querySelectorAll("span");
              dateSpans.forEach((span) => {
                const text = span.textContent.trim();
                if (
                  text &&
                  (text.includes("202") ||
                    text.match(
                      /[A-Za-z]{3},?\s+[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}/
                    ))
                ) {
                  date = text;
                }
              });
            }

            // Extract location - look for map-pin icon's sibling span
            let location = "";
            const mapPinIcon = eventCard.querySelector(".lucide-map-pin");
            if (mapPinIcon) {
              // Try next sibling
              let sibling = mapPinIcon.nextElementSibling;
              while (sibling) {
                if (sibling.tagName === "SPAN" && sibling.textContent.trim()) {
                  location = sibling.textContent.trim();
                  break;
                }
                sibling = sibling.nextElementSibling;
              }

              // If not found, look in parent container
              if (!location && mapPinIcon.parentElement) {
                const textContent = mapPinIcon.parentElement.textContent.trim();
                // Remove the icon text if present
                location = textContent.replace(/[^a-zA-Z0-9\s,.-]/g, "").trim();
              }
            }

            // Extract time - look for shopping-cart icon's sibling span
            let time = "";
            const cartIcon = eventCard.querySelector(".lucide-shopping-cart");
            if (
              cartIcon &&
              cartIcon.nextElementSibling &&
              cartIcon.nextElementSibling.tagName === "SPAN"
            ) {
              time = cartIcon.nextElementSibling.textContent.trim();
            }

            // Extract description
            let description = "";
            const descEl =
              eventCard.querySelector("p.text-sm.text-gray-400.line-clamp-2") ||
              eventCard.querySelector("p.line-clamp-2") ||
              eventCard.querySelector("p");
            if (descEl) {
              description = descEl.textContent.trim();
            }

            // Extract image
            const imgEl = eventCard.querySelector("img");
            const image = imgEl ? imgEl.getAttribute("src") : "";

            // Extract link
            const linkHref = link.getAttribute("href");
            const fullLink = linkHref
              ? linkHref.startsWith("http")
                ? linkHref
                : `https://www.ticketbox.co.zw${linkHref}`
              : "";

            // Extract price
            let price = "";
            const priceEl = eventCard.querySelector("p.text-2xl.font-semibold");
            if (priceEl) {
              price = priceEl.textContent.trim();
            }

            // Only add if we have basic info
            if (title && fullLink) {
              results.push({
                title,
                date,
                location,
                time,
                link: fullLink,
                image,
                description,
                price,
              });
            }
          }
        } catch (err) {
          console.error("Error processing event:", err);
        }
      });

      return results;
    });

    console.log(`Found ${events.length} potential events`);

    // Alternative approach: Direct CSS selector matching
    if (events.length === 0) {
      console.log("Trying alternative extraction method...");

      const altEvents = await page.evaluate(() => {
        const altResults = [];

        // Look for the exact structure from your HTML
        const eventCards = document.querySelectorAll(
          '.group, [class*="rounded"]'
        );

        eventCards.forEach((card) => {
          try {
            // Check if this looks like an event card
            const hasEventLink = card.querySelector('a[href*="/events/"]');
            if (!hasEventLink) return;

            // Extract using the exact structure from your HTML
            const titleEl = card.querySelector("h3.text-xl.font-semibold, h3");
            const title = titleEl ? titleEl.textContent.trim() : "";

            // Extract date - multiple methods
            let date = "";
            const dateSpan = card.querySelector(".text-gray-200");
            if (dateSpan) date = dateSpan.textContent.trim();

            if (!date) {
              const calendarSpan = card.querySelector(
                ".lucide-calendar + span"
              );
              if (calendarSpan) date = calendarSpan.textContent.trim();
            }

            // Extract location - FIXED: look for span after .lucide-map-pin
            let location = "";
            const mapPin = card.querySelector(".lucide-map-pin");
            if (mapPin) {
              // Find the next span sibling
              let nextSibling = mapPin.nextElementSibling;
              while (nextSibling) {
                if (nextSibling.tagName === "SPAN") {
                  location = nextSibling.textContent.trim();
                  break;
                }
                nextSibling = nextSibling.nextElementSibling;
              }

              // If still not found, try to find in the same div
              if (!location) {
                const parentDiv = mapPin.closest("div");
                if (parentDiv) {
                  const spans = parentDiv.querySelectorAll("span");
                  spans.forEach((span) => {
                    const text = span.textContent.trim();
                    if (
                      text &&
                      text.length > 10 &&
                      !text.includes("202") &&
                      !text.match(/\d{1,2}:\d{2}/)
                    ) {
                      location = text;
                    }
                  });
                }
              }
            }

            // Extract time
            let time = "";
            const cartIcon = card.querySelector(".lucide-shopping-cart");
            if (cartIcon) {
              let nextSibling = cartIcon.nextElementSibling;
              while (nextSibling) {
                if (nextSibling.tagName === "SPAN") {
                  time = nextSibling.textContent.trim();
                  break;
                }
                nextSibling = nextSibling.nextElementSibling;
              }
            }

            // Extract description
            let description = "";
            const descEl = card.querySelector("p.text-sm.text-gray-400");
            if (descEl) description = descEl.textContent.trim();

            // Extract image
            const imgEl = card.querySelector("img");
            const image = imgEl ? imgEl.getAttribute("src") : "";

            // Extract link
            const linkEl = card.querySelector('a[href*="/events/"]');
            const link = linkEl ? linkEl.getAttribute("href") : "";
            const fullLink = link
              ? link.startsWith("http")
                ? link
                : `https://www.ticketbox.co.zw${link}`
              : "";

            if (title && fullLink) {
              altResults.push({
                title,
                date,
                location,
                time,
                link: fullLink,
                image,
                description,
              });
            }
          } catch (err) {
            console.error("Error in alt extraction:", err);
          }
        });

        return altResults;
      });

      if (altEvents.length > 0) {
        events.push(...altEvents);
        console.log(`Added ${altEvents.length} events from alternative method`);
      }
    }

    // Process and format the events
    const formattedEvents = events
      .map((event) => {
        // Format dateRaw to dd/mm/yyyy
        let dateRaw = "";
        if (event.date) {
          try {
            // Clean up the date string (remove day prefix if present)
            const cleanDate = event.date.replace(/^[^,]*,/, "").trim();

            let dateObj;

            // Try standard date parsing
            dateObj = new Date(cleanDate);

            if (isNaN(dateObj.getTime())) {
              // Try to parse format like "Dec 5, 2025"
              const match = cleanDate.match(
                /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/
              );
              if (match) {
                const [, monthStr, day, year] = match;
                const months = {
                  Jan: 0,
                  Feb: 1,
                  Mar: 2,
                  Apr: 3,
                  May: 4,
                  Jun: 5,
                  Jul: 6,
                  Aug: 7,
                  Sep: 8,
                  Oct: 9,
                  Nov: 10,
                  Dec: 11,
                };

                const month = months[monthStr.substring(0, 3)];
                if (month !== undefined) {
                  dateObj = new Date(year, month, parseInt(day));
                }
              }
            }

            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, "0");
              const month = String(dateObj.getMonth() + 1).padStart(2, "0");
              const year = dateObj.getFullYear();
              dateRaw = `${day}/${month}/${year}`;
            }
          } catch (err) {
            console.log(`Error parsing date "${event.date}":`, err.message);
          }
        }

        return {
          title: event.title,
          dateRaw,
          date: event.date || "",
          link: event.link,
          image: event.image || "",
          source: ticketboxUrl,
          location: event.location || "",
        };
      })
      .filter((event) => event.title && event.link);

    // Remove duplicates
    const uniqueEvents = [];
    const seenLinks = new Set();

    formattedEvents.forEach((event) => {
      if (!seenLinks.has(event.link)) {
        seenLinks.add(event.link);
        uniqueEvents.push(event);
      }
    });

    if (res) {
      res.status(200).json(uniqueEvents);
    } else {
      return uniqueEvents;
    }
  } catch (err) {
    console.error("Scraping failed:", err.message);
    console.error(err.stack);

    if (res) {
      res.status(500).json({ error: err.message });
    }
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const getTicketBoxEvents = async (req, res) => {
  try {
    const cachedEvents = await redis.get("latestEvents");

    if (cachedEvents) {
      const allCachedEvents = JSON.parse(cachedEvents);

      const cachedTicketBoxEvents = allCachedEvents.filter(
        (event) => event.source === ticketboxUrl
      );

      return res.status(200).json(cachedTicketBoxEvents);
    }

    const events = await Event.findAll({
      where: {
        source: ticketboxUrl,
      },
      order: [["dateRaw", "ASC"]],
    });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { scrapeTicketbox, getTicketBoxEvents };
