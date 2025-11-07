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

const areEventsEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

cron.schedule("0 * * * *", async () => {
  console.log("Running event scraper....");

  const rawEvents = await Promise.all([
    await scrape10TimesEvents(),
    await scrapeAllEvents(),
    await scrapeHypeNation(),
    await scrapePredictHQ(),
    await scrapeChamines(),
    await scrapeConferenceAlerts(),
    await scrapeMotorsportsZimbabwe(),
    await scrapeAgricultureZimbabwe(),
    await scrapeEventsEye(),
    await scrapeTicketbox(),
  ]);

  const newEvents = rawEvents.flat();

  const oldEvents = await getStoredEvents();

  const fresh = newEvents.filter(
    (ne) => !oldEvents.some((oe) => areEventsEqual(ne, oe))
  );

  if (newEvents.length > 0) {
    await saveEvents(newEvents);
    emitNewEvents(fresh);
    console.log("Broadcasted new events");
  } else {
    console.log("No new events found");
  }
});
