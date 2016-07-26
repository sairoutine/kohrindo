'use strict';
var util = require('util');
var Slack = require('../lib/slack');

var config = require('config');
var BASE_PATH = config.site.base_url;


var ControllerBase = require('./base');

// コンストラクタ
var HelpController = function() {
	ControllerBase.apply(this,arguments);
};
// ControllerBaseを継承
util.inherits(HelpController, ControllerBase);


/* ヘルプページ */
HelpController.prototype.index = function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	res.render('help/index', data);
};

/* お問い合わせ */
HelpController.prototype.contact = function(req, res, next) {
	var text = req.body.text;

	/* Slack への通知 */
	var slack = new Slack({hook_url: process.env.SLACK_INCOMING_WEBHOOK});

	// process.env.slack_incoming_webhook
	/*
	slack.send("@sairoutine\nご意見・ご要望\n", [{
		color: "#36a64f",
		text: text
	}]);
	*/	
	res.redirect(BASE_PATH);
};

module.exports = HelpController;
