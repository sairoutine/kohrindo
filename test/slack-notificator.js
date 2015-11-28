var Slack = require('./slack');

var slack = new Slack({hook_url: process.env.slack_incoming_webhook});

slack.send('test');
