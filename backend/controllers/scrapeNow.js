const { scrapeAllEvents } = require("./allEvents");
const { scrapeHypeNation } = require("./hypeNation");
const { scrape10TimesEvents } = require("./tenTimes");
const { scrapeChamines } = require("./chamines");
const { scrapeConferenceAlerts } = require("./conferenceAlerts");
const { scrapeMotorsportsZimbabwe } = require("./motorsportZim");
const { scrapeAgricultureZimbabwe } = require("./zimAgriculture");
const { scrapeEventsEye } = require("./tradeShows");
const { scrapeTicketbox } = require("./ticketBox");

async function scrapeNow() {
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
      console.error("❌ Scraper error:", scrape.name, err);
    }
  }

  return results.filter((e) => e && (e.link || e.source));
}

module.exports = { scrapeNow };
