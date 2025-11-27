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
(async () => {
  console.log("Running initial event scraper on startup...");
  await runScraper();
})();

// Schedule to run every hour
cron.schedule("0 * * * *", async () => {
  await runScraper();
});

async function runScraper() {
  console.log("Running event scraper at", new Date().toISOString());

  try {
    const rawEvents = await Promise.all([
      scrape10TimesEvents(),
      scrapeAllEvents(),
      scrapeHypeNation(),
      /* scrapePredictHQ(), */
      scrapeChamines(),
      /* fetchSerpapiEvents(),*/
      scrapeConferenceAlerts(),
      scrapeMotorsportsZimbabwe(),
      scrapeAgricultureZimbabwe(),
      scrapeEventsEye(),
      scrapeTicketbox(),
    ]);

    const newEvents = rawEvents.flat().filter((e) => e && (e.link || e.source));

    console.log(`Scraped ${newEvents.length} total events from all sources`);

    if (newEvents.length === 0) {
      return;
    }

    await saveEvents(newEvents);

    // Emit all new events via socket (or you can modify this to only emit if needed)
    if (newEvents.length > 0) {
      emitNewEvents(newEvents);
    } else {
      console.log("No events to broadcast");
    }
  } catch (error) {
    console.error("Error in scraper:", error);
  }
}

module.exports = { runScraper };
