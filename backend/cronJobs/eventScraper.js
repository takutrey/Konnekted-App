const cron = require("node-cron");
const redis = require("../utils/cache");

const { scrapeNow } = require("../controllers/scrapeNow");
const { saveEvents } = require("../models/events");

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
    const events = await scrapeNow();
    await saveEvents(events);

    await redis.set("latestEvents", JSON.stringify(events), {
      EX: 21600,
    });

    console.log("Cache and db updated");
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
