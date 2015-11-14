var knex = require('../lib/knex');
var util = require('util');

var ControllerBase = require('./base');

// コンストラクタ
var HelpController = function() {
	ControllerBase.apply(this,arguments);
};
// ControllerBaseを継承
util.inherits(HelpController, ControllerBase);


/* 同人誌の一覧 */
HelpController.prototype.index = function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	res.render('help/index', data);
};

module.exports = HelpController;
