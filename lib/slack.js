"use strict";

/* TODO: attachment対応 */

var request  = require('request');
var Promise = require('bluebird');

function Slack(options) {
	if (!options.hook_url) { throw new Error('no hook_url specified.'); }

	this.hook_url   = options.hook_url;
	this.username   = options.username   ? options.username : 'marisa';
	this.channel    = options.channel    ? options.channel : '#general';
	this.icon_url   = options.icon_url   ? options.icon_url : 'https://avatars.slack-edge.com/2015-07-08/7364602966_93cfba0425bdbc91ea47_32.jpg';
	this.link_names = options.link_names ? options.link_names : true;
}

Slack.prototype.send = function(text, attachments) {
	var self = this;

	return new Promise(function(resolve, reject) {
		if (!text) { return resolve(new Error('no text specified.')); }

		var body = {
			channel: self.channel,
			username: self.username,
			icon_url: self.icon_url,
			text:     text,
		};

		if (attachments) { body.attachments = attachments; }

		var request_option = {
			url:   self.hook_url,
			body:  JSON.stringify(body)
		};

		request.post(request_option, function(err, res, body) {
			if (err) { return reject(err); }
			if (body !== 'ok') { return reject(new Error(body)); }

			return resolve(body);
		});
	});
};

module.exports = Slack;
