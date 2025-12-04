const express = require("express");
const router = express.Router();
const { getAllEvents } = require("../controllers/allEvents");
const { getHypeNationEvents } = require("../controllers/hypeNation");
const { getTenTimesEvents } = require("../controllers/tenTimes");
const { searchEvents } = require("../controllers/search");
const { scrapePredictHQ } = require("../controllers/predictHQ");
const { getChaminesEvents } = require("../controllers/chamines");
const { getConferenceAlertEvents } = require("../controllers/conferenceAlerts");
const { getMotorsportEvents } = require("../controllers/motorsportZim");
const {
  scrapeAgricultureZimbabwe,
  getZimAgricEvents,
} = require("../controllers/zimAgriculture");
const { getTradeShowsEvents } = require("../controllers/tradeShows");
const { getTicketBoxEvents } = require("../controllers/ticketBox");
const { fetchSerpapiEvents } = require("../controllers/serpapi");
const { getEventsBySource } = require("../models/events");
const { EventsFromDB } = require("../controllers/dbEvents");
const { getZimTicketsEvents } = require("../controllers/zimTickets");

router.get("/allevents", getAllEvents);
router.get("/hype-nation", getHypeNationEvents);
router.get("/tentimes", getTenTimesEvents);
/*router.get("/predict-hq", scrapePredictHQ);*/
router.get("/chamines", getChaminesEvents);
/*router.get("/serpapi-events", fetchSerpapiEvents);*/
router.get("/conference-alerts", getConferenceAlertEvents);
router.get("/motorsports", getMotorsportEvents);
router.get("/agric-zim", getZimAgricEvents);
router.get("/events-eye", getTradeShowsEvents);
router.get("/ticket-box", getTicketBoxEvents);
router.get("/zim-tickets", getZimTicketsEvents);
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
