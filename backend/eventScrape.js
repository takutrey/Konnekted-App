const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const Ten10TimesUrl = "https://10times.com/zimbabwe";
const zimCricketMatchesUrl = "https://www.zimcricket.org/match-center/matches";

const scrape10TimesEvents = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  );

  await page.goto(Ten10TimesUrl, { waitUntil: "networkidle2", timeout: 0 });

  const events = await page.evaluate(() => {
    const rows = document.querySelectorAll("tr.event-card");
    const results = [];

    rows.forEach((el) => {
      const title = el.querySelector("h2 span.d-block")?.innerText.trim() || "";
      const dateElement = el.querySelector("[data-start-date]");
      const startDate = dateElement?.getAttribute("data-start-date") || "";
      const endDate = dateElement?.getAttribute("data-end-date") || "";
      const dateText = dateElement?.innerText.trim() || "";

      const location =
        el.querySelector(".venue")?.innerText.replace(/\s+/g, " ").trim() || "";

      const description =
        el
          .querySelector("td:nth-child(4) > div")
          ?.innerText.replace(/\s+/g, " ")
          .trim() || "";

      const onclickAttr =
        el.querySelector("td.show-related")?.getAttribute("onclick") || "";
      const linkMatch = onclickAttr.match(/window\.open\('(.*?)'/);
      const link = linkMatch ? linkMatch[1] : "";

      const category =
        el.querySelector("td:nth-child(5) span")?.innerText.trim() || "";
      const tag = el.querySelector("td:nth-child(5) a")?.innerText.trim() || "";

      results.push({
        title,
        date: dateText,
        startDate,
        endDate,
        location,
        description,
        link,
        category,
        tag,
      });
    });

    return results;
  });

  await browser.close();
  return events;
};

const scrapeZimCricketMatches = async () => {
  try {
    const { data } = await axios.get(zimCricketMatchesUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);
    const matches = [];

    $(".sc-c28fe343-11").each((_, el) => {
      const status = $(el)
        .find(".sc-c28fe343-15 span.sc-782a1382-4")
        .text()
        .trim();
      const dateTimeVenue = $(el)
        .find(".sc-c28fe343-15 p.sc-782a1382-6")
        .text()
        .trim();
      const seriesName = $(el)
        .find(".sc-c28fe343-15 p.sc-782a1382-7")
        .text()
        .trim();
      const scheduledText = $(el)
        .find(".sc-c28fe343-15 p.sc-782a1382-18")
        .text()
        .trim();

      const teams = $(el)
        .find(".sc-c28fe343-15 .sc-782a1382-11")
        .map((_, teamEl) => {
          const name = $(teamEl).find("span.sc-782a1382-13").text().trim();
          const img = $(teamEl).find("img").attr("src");
          return {
            name,
            logo: img?.startsWith("http")
              ? img
              : `https://www.cricheroes.in${img}`,
          };
        })
        .get();

      matches.push({
        status,
        dateTimeVenue,
        seriesName,
        scheduledText,
        teams,
      });
    });

    console.log(matches);
  } catch (error) {
    console.error("Scraping error:", error);
  }
};

/*scrapeZimCricketMatches();*/
/*scrape10TimesEvents();*/
/*scrapeAllEvents();*/
scrapeHypeNation();
