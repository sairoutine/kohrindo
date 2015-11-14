var redis = require("then-redis"),
    client = redis.createClient();

client.on("error", function (err) {
	throw new Error(err);
});

module.exports = client;
