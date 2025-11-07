const axios = require("axios");
require("dotenv").config();
const dayjs = require("dayjs");

const scrapePredictHQ = async (req, res) => {
  try {
    const isoNow = new Date().toISOString();

    const response = await axios.get("https://api.predicthq.com/v1/events/", {
      headers: {
        Authorization: `Bearer ${process.env.PREDICTHQ_API_KEY}`,
        Accept: "*/*",
      },
      params: {
        "active.gt": isoNow,
        country: "ZW",
      },
    });

    const events = (response.data.results || []).map((event) => ({
      title: event.title,
      dateRaw: event.start,
      date: dayjs(event.start).format("ddd, D MMM"),
      location:
        event.place_hierarchies?.[0]?.filter(Boolean).join(", ") || "Zimbabwe",
      time: dayjs(event.start).format("HH:mm"),
      link: `https://predicthq.com/events/${event.id}`,
      category: event.category,
      price: event.predicted_event_spend || null,
      source: "https://predicthq.com/events",
    }));

    if (res) {
      res.status(200).json(events);
    } else {
      return events;
    }
  } catch (error) {
    console.error("PredictHQ error", error.message);
    if (res) {
      return res.status(500).json({ error: error.message });
    }

    return [];
  }
};

module.exports = { scrapePredictHQ };
