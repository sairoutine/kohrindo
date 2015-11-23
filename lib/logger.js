"use strict";

var bunyan = require('bunyan');
var path = require('path');

var log = bunyan.createLogger({
	name: "kohrindo",
	level: 'info',
	streams: [{
		type: 'rotating-file',
		path: path.join(__dirname, '../log/kohrindo.log'),
		period: '1d',
		count: 14
	}]
});

module.exports = log;
