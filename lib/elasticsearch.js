"use strict";

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
	host: {
		protocol: 'http',
		host: 'localhost',
		port: 9200,
	},
	log: 'trace',
	apiVersion: '2.0',
	requestTimeout: '3000',
	keepAlive: true,
	maxSockets: 10,
	minSockets: 1,
});
module.exports = client;
