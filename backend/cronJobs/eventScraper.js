const cron = require("node-cron");
const { scrapeAllEvents } = require("../controllers/allEvents");
const { scrapeHypeNation } = require("../controllers/hypeNation");
const { scrape10TimesEvents } = require("../controllers/tenTimes");
const { emitNewEvents } = require("../sockets/eventSocket");
const { getStoredEvents, saveEvents } = require("../models/events");
const { scrapePredictHQ } = require("../controllers/predictHQ");
const { scrapeChamines } = require("../controllers/chamines");
const { scrapeConferenceAlerts } = require("../controllers/conferenceAlerts");
const { scrapeMotorsportsZimbabwe } = require("../controllers/motorsportZim");
const { scrapeAgricultureZimbabwe } = require("../controllers/zimAgriculture");
const { scrapeEventsEye } = require("../controllers/tradeShows");
const { scrapeTicketbox } = require("../controllers/ticketBox");
const { fetchSerpapiEvents } = require("../controllers/serpapi");

// Run immediately on startup
// Protect against overlapping scrapes
let isRunning = false;

// Run scraper safely
async function runScraper() {
  if (isRunning) {
    console.log("⏳ Skipping: previous scrape still running");
    return;
  }

  isRunning = true;
  console.log("🚀 Running event scraper at", new Date().toISOString());

  try {
    // Run sequentially to reduce CPU blocking
    const scrapers = [
      scrape10TimesEvents,
      scrapeAllEvents,
      scrapeHypeNation,
      scrapeChamines,
      scrapeConferenceAlerts,
      scrapeMotorsportsZimbabwe,
      scrapeAgricultureZimbabwe,
      scrapeEventsEye,
      scrapeTicketbox,
    ];

    const results = [];

    for (const scrape of scrapers) {
      try {
        const r = await scrape();
        if (Array.isArray(r)) results.push(...r);
      } catch (err) {
        console.error("❌ Error in scraper:", scrape.name, err.message);
      }
    }

    const newEvents = results.filter((e) => e && (e.link || e.source));

    console.log(`📌 Collected ${newEvents.length} events`);

    if (newEvents.length > 0) {
      await saveEvents(newEvents);
      emitNewEvents(newEvents);
    }
  } catch (err) {
    console.error("❌ Fatal scraper error:", err);
  }

  isRunning = false;
}

// Run once on startup
(async () => {
  console.log("🚀 Initial run on startup");
  await runScraper();
})();

// Once every 24 hours (midnight)
cron.schedule("0 0 * * *", async () => {
  console.log("📅 Daily scrape triggered");
  await runScraper();
});

module.exports = { runScraper };
