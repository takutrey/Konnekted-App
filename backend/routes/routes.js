const express = require("express");
const router = express.Router();
const { scrapeAllEvents } = require("../controllers/allEvents");
const { scrapeHypeNation } = require("../controllers/hypeNation");
const { scrape10TimesEvents } = require("../controllers/tenTimes");
const { searchEvents } = require("../controllers/search");
const { scrapePredictHQ } = require("../controllers/predictHQ");
const { scrapeChamines } = require("../controllers/chamines");
const { scrapeConferenceAlerts } = require("../controllers/conferenceAlerts");
const { scrapeMotorsportsZimbabwe } = require("../controllers/motorsportZim");
const { scrapeAgricultureZimbabwe } = require("../controllers/zimAgriculture");
const { scrapeEventsEye } = require("../controllers/tradeShows");
const { scrapeTicketbox } = require("../controllers/ticketBox");
const { fetchSerpapiEvents } = require("../controllers/serpapi");
const { getEventsBySource } = require("../models/events");
const { EventsFromDB } = require("../controllers/dbEvents");

router.get("/allevents", scrapeAllEvents);
router.get("/hype-nation", scrapeHypeNation);
router.get("/tentimes", scrape10TimesEvents);
/*router.get("/predict-hq", scrapePredictHQ);*/
router.get("/chamines", scrapeChamines);
/*router.get("/serpapi-events", fetchSerpapiEvents);*/
router.get("/conference-alerts", scrapeConferenceAlerts);
router.get("/motorsports", scrapeMotorsportsZimbabwe);
router.get("/agric-zim", scrapeAgricultureZimbabwe);
router.get("/events-eye", scrapeEventsEye);
router.get("/ticket-box", scrapeTicketbox);
router.get("/all-events", EventsFromDB);
router.get("/search", searchEvents);
router.get("/events-by-link/:link", async (req, res) => {
  try {
    const { link } = req.params;
    const events = await getEventsByLink(link);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events by link:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

module.exports = router;
