'use strict';
var util = require('util');
var Promise = require('bluebird');

var knex = require('../lib/knex');

// doujinshi elastic model
var elastic = require('../model/elastic/doujinshi');

var ControllerBase = require('./base');

// コンストラクタ
var SearchController = function() {
	ControllerBase.apply(this,arguments);
};
// ControllerBaseを継承
util.inherits(SearchController, ControllerBase);

/* 検索 */
SearchController.prototype.index = function(req, res, next) {
	// 1ページあたりに表示する検索結果
	var limit = 12;

	// 検索ワード
	var search_word = req.query.query;

	// ページング
	var offset = parseInt(req.query.page) || 0;

 	/* viewに渡すパラメータ */
	var data = {};

	/* 検索結果件数 */
	var total_count;

	Promise.resolve()
	.then(function() {
		if(search_word.length > 0) {
			return elastic.search_by_all(search_word, limit, offset * limit);
		}
		else {
			return [];
		}
	})
	.then(function(results) {
		total_count = results.hits.total;

		/* 検索結果の同人誌ID一覧 */
		var doujishi_ids = [];
		results.hits.hits.forEach(function(res) {
			doujishi_ids.push(res._id);
		});

		return knex.select('*')
		.from('doujinshi')
		.whereIn('id', doujishi_ids);
	})
	.then(function(rows) {
		/* 同人誌一覧情報 */
		data.doujinshi = rows;

		/* 検索ワード */
		data.query = search_word;

		/* ページング用 */
		data.pagination = {
			total_count: total_count,
			page_size: limit,
			page_count: Math.ceil(total_count / limit),
			current_page: offset,
			url: 'search?query=' + search_word + '&page=',
		};

		res.render('search/index', data);
	})
	.catch(function(err) {
		return next(err);
	});
};

module.exports = SearchController;
