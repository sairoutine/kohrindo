'use strict';
var util = require('util');

var ControllerBase = require('./base');

// コンストラクタ
var SearchController = function() {
	ControllerBase.apply(this,arguments);
};
// ControllerBaseを継承
util.inherits(SearchController, ControllerBase);

/* 検索 */
SearchController.prototype.index = function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	res.render('search/index', data);
};

module.exports = SearchController;
