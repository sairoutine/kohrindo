var knex = require('../lib/knex');
var util = require('util');

var ControllerBase = require('./base');

// コンストラクタ
var IndexController = function() {
	ControllerBase.apply(this,arguments);
};
// ControllerBaseを継承
util.inherits(IndexController, ControllerBase);

/* indexページ */
IndexController.prototype.index = function(req, res, next) {
	/* 1ページに表示する感想件数 */
	var limit_num = 5;

 	/* viewに渡すパラメータ */
	var data = {
		/* 最近投稿された感想 */
		impression: []
	};

	/* 同人誌の感想一覧を取得 */
	knex.select('id', 'doujinshi_id', 'body', 'create_time')
	.from('impression')
	.orderBy('id', 'desc')
	.limit(limit_num)
	.offset(0)
	.then(function(rows) {
		data.impression = rows;

		/* doujinshi_ids を作成 */
		var doujinshi_ids = [];

		rows.forEach(function(row) {
			doujinshi_ids.push(row.doujinshi_id);
		});

		return knex
		.select('id', 'title', 'author', 'thumbnail')
		.from('doujinshi')
		.whereIn('id', doujinshi_ids);
	})
	.then(function(rows) {
		var doujinshi_id_row_hash = {};

		/* 同人誌の情報を連想配列に変換 */
		rows.forEach(function(row) {
			doujinshi_id_row_hash[row.id] = row;
		});

		/* 感想に同人誌情報を付加 */
		for(var i=0; i<data.impression.length; i++) {
			data.impression[i].doujinshi = doujinshi_id_row_hash[data.impression[i].doujinshi_id];
		}

		res.render('index', data);
	});
};

module.exports = IndexController;
