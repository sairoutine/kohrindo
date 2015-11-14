var knex = require('../lib/knex');
var util = require('util');

var RedisModel = require('../model/redis');

var DoujinController = require('./doujin');

var ControllerBase = require('./base');

// コンストラクタ
var ImpressionController = function() {
	ControllerBase.apply(this,arguments);
};
// ControllerBaseを継承
util.inherits(ImpressionController, ControllerBase);

/* 感想一覧 */
ImpressionController.prototype.list = function(req, res, next) {
	/* 1ページに表示する感想件数 */
	var limit_num = 5;

	var offset = parseInt(req.query.page) || 0;

 	/* viewに渡すパラメータ */
	var data = {};

	var impression_num;
	var impression_rows;

	/* 同人誌の感想の数を取得 */
	knex.count('* as impression_num')
	.from('impression')
	.then(function(rows) {
		impression_num = rows[0].impression_num;

		/* 同人誌の感想一覧を取得 */
		return knex.select('id', 'doujinshi_id', 'user_id', 'body', 'create_time')
		.from('impression')
		.orderBy('id', 'desc')
		.limit(limit_num)
		.offset(offset * limit_num);
	})
	.then(function(rows) {
		impression_rows = rows;

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
		for(var i=0; i<impression_rows.length; i++) {
			impression_rows[i].doujinshi = doujinshi_id_row_hash[impression_rows[i].doujinshi_id];
		}

		/* テンプレに感想データを渡す */
		data.impression = impression_rows;

		/* ページング用 */
		data.pagination = {
			total_count: impression_num,
			page_size: limit_num,
			page_count: Math.ceil(impression_num / limit_num),
			current_page: offset,
			url: '/impression/list/?page=',
		};

		res.render('impression/list', data);
	})
	.catch(function(err_message) {
		next(new Error(err_message));
	});
};

/* 感想の個別ページ */
ImpressionController.prototype.i = function(req, res, next) {
	var impression_id = req.params.id;

	/* view に渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	/* 感想情報を取得 */
	knex.select('doujinshi_id', 'user_id', 'body', 'create_time')
	.from('impression')
	.where('id', impression_id)
	.then(function(impression_rows) {
		data.body         = impression_rows[0].body;
		data.create_time  = impression_rows[0].create_time;
		data.user_id      = impression_rows[0].user_id;
		data.doujinshi_id = impression_rows[0].doujinshi_id;

		var doujinshi_id = impression_rows[0].doujinshi_id;
		var user_id      = impression_rows[0].user_id;

		/* 同人誌情報 */
		knex.select(['title', 'author', 'circle', 'url', 'thumbnail'])
		.from('doujinshi')
		.where('id', doujinshi_id)
		.then(function(rows) {
			data.title     = rows[0].title;
			data.author    = rows[0].author;
			data.circle    = rows[0].circle;
			data.url       = rows[0].url;
			data.thumbnail = rows[0].thumbnail;

			/* 感想のユーザー名を取得 */
			knex.select('displayname')
			.from('user')
			.whereIn('id', user_id)
			.then(function(user_rows) {

				data.displayname = user_rows[0].displayname;
				res.render('impression/i', data);
			})
			.catch(function(err_message) {
				next(new Error(error_message));
			});
		})
		.catch(function(err_message) {
			next(new Error(err_message));
		});
	})
	.catch(function(err_message) {
		next(new Error(err_message));
	});
};

/* 感想登録処理 */
ImpressionController.prototype.register = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var doujinshi_id = req.body.id;
	var body         = req.body.body;
	var user_id      = req.user;

	/* 入力値チェック */
	var error_messages = [];

	if(body.length === 0){
		error_messages.push('感想が入力されていません。');
	}

	if(body.length > 10000){
		error_messages.push('感想は10000字までです。');
	}

	/* 入力ミスがあれば */
	if (error_messages.length) {
		req.error_messages = error_messages;
		req.params.id = doujinshi_id;
		DoujinController.prototype.i(req, res, next);
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	knex('impression').insert({
			'doujinshi_id': doujinshi_id,
			'user_id': req.user,
			'body': body,
			'create_time': now,
			'update_time': now
	})
	.then(function() {
		return RedisModel.set_user_notification(req.user, 'success', '感想の投稿が完了しました！');
	})
	.then(function(impression_id) {
		res.redirect(BASE_PATH + 'doujin/i/' + doujinshi_id);
	})
	.catch(function(err) {
		next(err);
	});
};

/* 感想編集処理 */
ImpressionController.prototype.edit = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	var impression_id = req.body.impression_id;
	var body          = req.body.body;

	/* viewに渡すパラメータ */
	var data = {};

	/* 入力値チェック */
	if(body.length === 0){
		res.redirect(BASE_PATH + 'impression/i' + doujinshi_id);
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* 感想が付随してる同人誌ID */
	var doujinshi_id;

	knex.select('user_id', 'doujinshi_id')
	.from('impression')
	.where('id', impression_id)
	.then(function(rows) {
		/* 悪意あるユーザーが他人の感想を編集してないかチェック */
		if(req.user != rows[0].user_id) {
			res.redirect(BASE_PATH);
			return;
		}

		doujinshi_id = rows[0].doujinshi_id;

		return knex('impression')
		.update({
			'body': body
		})
		.where('id', impression_id);
	})
	.then(function() {
		return RedisModel.set_user_notification(req.user, 'success', '感想を修正しました！');
	})
	.then(function() {
		res.redirect(BASE_PATH + 'doujin/i/' + doujinshi_id);
	})
	.catch(function(err) {
		next(err);
	});
};


module.exports = ImpressionController;
