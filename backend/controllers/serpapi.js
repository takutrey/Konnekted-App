const axios = require("axios");
require("dotenv").config();

const CITIES = [
  "Harare",
  "Bulawayo",
  "Chitungwiza",
  "Mutare",
  "Gweru",
  "Masvingo",
  "Kadoma",
  "Kwekwe",
  "Victoria Falls",
  "Marondera",
  "Kariba",
];

async function fetchSerpapiCityEvents(city) {
  const url = "https://serpapi.com/search.json";

  const params = {
    engine: "google_events",
    q: `Events in ${city}, Zimbabwe`,
    hl: "en",
    gl: "zw",
    api_key: process.env.SERPAPI_EVENTS_API,
    no_cache: true,
  };

  try {
    const response = await axios.get(url, {
      params,
      timeout: 30000, // 30 seconds
    });

    const json = response.data;
    if (!json.events_results) return [];

    return json.events_results.map((ev) => ({
      city,
      title: ev.title,
      link: ev.link,
      dateRaw: ev.date?.start_date || null,
      date: ev.date?.when || null,
      image: ev.thumbnail || null,
      location: Array.isArray(ev.address)
        ? ev.address.join(", ")
        : ev.address || null,
      source: "serpapi",
    }));
  } catch (err) {
    console.error(`❌ SerpApi failed for ${city}:`, err.message);
    return []; // NEVER throw — always resolve
  }
}

async function fetchSerpapiEvents() {
  try {
    const promises = CITIES.map((city) => fetchSerpapiCityEvents(city));
    const results = await Promise.all(promises);

    // Flatten results
    let events = results.flat();

    // Deduplicate by link/title
    const uniqueMap = new Map();

    events.forEach((ev) => {
      const key = ev.link || ev.title;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ev);
      }
    });

    return Array.from(uniqueMap.values());
  } catch (err) {
    console.error("❌ Unexpected SerpApi error:", err.message);
    return [];
  }
}

module.exports = { fetchSerpapiEvents };
