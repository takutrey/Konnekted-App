const redis = require("redis");

const client = redis.createClient({
  username: "default",
  password: "KEw35d0MlvE0G8UW06JFZybwkbZYrMzj",
  socket: {
    host: "redis-13216.c10.us-east-1-2.ec2.cloud.redislabs.com",
    port: 13216,
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect();

module.exports = client;
