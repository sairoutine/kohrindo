"use strict";

var elasticsearch = require('elasticsearch');
var config = require('config');
var client = new elasticsearch.Client(config.elasticsearch);
module.exports = client;
