'use strict';

var config = require("config");
var redis = require("then-redis");
var client = redis.createClient(config.redis);

client.on("error", function (err) {
	throw new Error(err);
});

module.exports = client;
