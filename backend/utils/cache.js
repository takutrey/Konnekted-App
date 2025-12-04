const redis = require("redis");

const client = redis.createClient({
  url: "redis://localhost:6379",
});

client.on("error", (error) => {
  console.error("Redis client error", error);
});

client.connect();

module.exports = client;
