'use strict';
var imagemagick = require('imagemagick-native');
var fs = require('fs');
var util = require('util');
var config = require('config');
var BASE_PATH = config.site.base_url;

var knex = require('../lib/knex');
var external_doujin_info = require('../lib/external_doujin_info');
var RedisModel = require('../model/redis');

var ControllerBase = require('./base');

// コンストラクタ
var DoujinController = function() {
	ControllerBase.apply(this,arguments);
};
// ControllerBaseを継承
util.inherits(DoujinController, ControllerBase);


/* 同人誌の一覧 */
/* :id ページング用 */
DoujinController.prototype.list = function(req, res, next) {
	/* 1ページに表示する同人誌件数 */
	var limit_num = 12;

	var offset       = parseInt(req.query.page) || 0;

 	/* viewに渡すパラメータ */
	var data = {};

	/* 同人誌の感想一覧を取得 */
	knex.select('id', 'title', 'author', 'thumbnail')
	.from('doujinshi')
	.orderBy('id', 'desc')
	.limit(limit_num)
	.offset(offset * limit_num)
	.then(function(doujinshi_rows) {

		if(doujinshi_rows.length === 0) {
			/* TODO: Promisableにしたい */
			data.doujinshi = [];
			res.render('doujin/list', data);
			return;
		}

		/* 同人誌一覧をテンプレに渡す */
		data.doujinshi = doujinshi_rows;

		knex.count('* as doujinshi_num')
		.from('doujinshi')
		.then(function(rows) {
			/* ページング用 */
			data.pagination = {
				total_count: rows[0].doujinshi_num,
				page_size: limit_num,
				page_count: Math.ceil(rows[0].doujinshi_num / limit_num),
				current_page: offset,
				url: '/doujin/list/?page=',
			};

			res.render('doujin/list', data);
		})
		.catch(function(err_message) {
			next(new Error(err_message));
		});
	})
	.catch(function(err_message) {
		next(new Error(err_message));
	});
};

/* 同人誌の個別ページ */
/* :id 同人誌のID */
DoujinController.prototype.i = function(req, res, next) {
	/* 1ページに表示する感想件数 */
	var limit_num = 5;

	var doujinshi_id = req.params.id;
	var offset       = parseInt(req.query.page) || 0;

	/* view に渡すパラメータ */
	var data = {
		/* 自分の投稿した感想 */
		my_impression: {},

		/* 同人誌に付随する感想一覧 */
		impression: []
	};

	/* 同人誌情報 */
	knex.select(['title', 'author', 'circle', 'url', 'thumbnail', 'cover_image'])
	.from('doujinshi')
	.where('id', doujinshi_id)
	.then(function(rows) {
		if(rows.length === 0) {
			res.redirect(BASE_PATH);
			return;
		}

		data.id          = doujinshi_id;
		data.title       = rows[0].title;
		data.author      = rows[0].author;
		data.circle      = rows[0].circle;
		data.url         = rows[0].url;
		data.thumbnail   = rows[0].thumbnail;
		data.cover_image = rows[0].cover_image;

		/* 同人誌の感想一覧を取得 */
		return knex.select('id', 'user_id', 'body', 'create_time')
		.from('impression')
		.where('doujinshi_id', doujinshi_id)
		.orderBy('id', 'desc')
		.limit(limit_num)
		.offset(offset * limit_num);
	})
	.then(function(impression_rows) {
		data.impression = impression_rows;

		/* IN句用にuser_id の配列を作成 */
		var user_ids = [];
		impression_rows.forEach(function(row) {
			user_ids.push(row.user_id);

			/* 自分が既に感想を投稿してればテンプレのbodyに渡す */
			if(row.user_id === req.user) {
				/* 感想ID */
				data.my_impression.id = row.id;
				/* 感想本文 */
				data.my_impression.body = row.body;
			}
		});

		/* 感想の投稿でエラーがあって呼び出された場合 */
		if (req.error_messages) {
			data.my_impression.body = req.body.body;
			data.error_messages = req.error_messages;
		}

		/* 感想一覧のユーザー名を取得 */
		return knex.select('id', 'thumbnail', 'displayname')
		.from('user')
		.whereIn('id', user_ids);
	})
	.then(function(user_rows) {
		/* user_id -> displayname の連想配列を作成 */
		var user_id_displayname_hash = {};
		/* user_id -> thumbnail の連想配列を作成 */
		var user_id_thumbnail_hash = {};

		user_rows.forEach(function(row) {
			user_id_displayname_hash[row.id] = row.displayname;
			user_id_thumbnail_hash[row.id]   = row.thumbnail;
		});

		/* impression_rows に displayname と thumbnail を追加 */
		for(var i=0; i<data.impression.length; i++) {
			data.impression[i].displayname = user_id_displayname_hash[data.impression[i].user_id];
			data.impression[i].thumbnail   = user_id_thumbnail_hash[data.impression[i].user_id];
		}

		return knex.count('* as impression_num')
		.from('impression')
		.where('doujinshi_id', doujinshi_id);
	})
	.then(function(rows) {
		/* ページング用 */
		data.pagination = {
			total_count: rows[0].impression_num,
			page_size: limit_num,
			page_count: Math.ceil(rows[0].impression_num / limit_num),
			current_page: offset,
			url: '/doujin/i/' + doujinshi_id + '?page=',
		};

		res.render('doujin/i', data);
	})
	.catch(function(err) {
		next(err);
	});
};


/* 同人誌の編集のための入力画面 */
/* :id 同人誌ID */
DoujinController.prototype.edit_top = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	var doujinshi_id = req.params.id;

	/* viewに渡すパラメータ */
	var data = {
		/* エラーメッセージ */
		error_messages: [],
	};

	/* 同人誌情報 */
	knex.select(['title', 'author', 'circle', 'url', 'thumbnail'])
	.from('doujinshi')
	.where('id', doujinshi_id)
	.then(function(rows) {
		data.id        = doujinshi_id;
		data.title     = rows[0].title;
		data.author    = rows[0].author;
		data.circle    = rows[0].circle;
		data.url       = rows[0].url;
		data.thumbnail = rows[0].thumbnail;

		/* edit から呼び出された場合ユーザーから入力された値を優先 */
		if (req.error_messages) {
			data.author = req.body.author;
			data.circle = req.body.circle;
			data.url    = req.body.url;
			data.error_messages = req.error_messages;
		}

		res.render('doujin/edit_top', data);
	})
	.catch(function(err) {
		next(err);
	});
};

/* 同人誌の編集処理 */
DoujinController.prototype.edit = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var id = req.body.id;
	var update_data = {
		author: req.body.author,
		circle: req.body.circle,
		url:    req.body.url,
	};

	/* 入力値チェック */
	var error_messages = [];

	if(update_data.author.length > 255){
		error_messages.push('著者名が長過ぎます。');
	}

	if(update_data.circle.length > 255){
		error_messages.push('サークル名が長すぎます。');
	}

	if(update_data.url.length > 255){
		error_messages.push('URLが長すぎます。');
	}

	if(update_data.url.length > 0 && !/^https?:\/\/.*$/.test(update_data.url)){
		error_messages.push('正しいURLを入力してください。');
	}

	/* 入力ミスがあれば */
	if (error_messages.length) {
		req.error_messages = error_messages;
		req.params.id = id;
		DoujinController.prototype.edit_top(req, res, next);
		return;
	}

	/* 表紙画像の変更があれば */
	if(req.file){
		var thumbnail_name = 's_' + req.file.filename;

		/* 画像を縮小 */
		fs.writeFileSync('./public/img/doujin/' + thumbnail_name, imagemagick.convert({
			srcData: fs.readFileSync(req.file.path),
			width: 150,
			height: 150,
			resizeStyle: 'aspectfit',
		}));

		update_data.thumbnail = 'doujin/' + thumbnail_name;
		update_data.cover_image = 'doujin/' + req.file.filename;
	}

	require('date-utils');

	var dt = new Date();
	update_data.update_time = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* 作品の登録 */
	knex('doujinshi').update(update_data)
	.where('id', id)
	.then(function() {
		return RedisModel.set_user_notification(req.user, 'success', '小説情報の編集が完了しました！');
	})
	.then(function() {
		res.redirect(BASE_PATH + 'doujin/i/' + id);
	})
	.catch(function(err) {
		next(new Error(err));
	});
};



/* 同人誌の登録のための入力画面 */
DoujinController.prototype.register_top = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	 /* viewに渡すパラメータ */
	var data = {
		'title': '',
		'author': '',
		'circle': '',
		'url': '',
	};

	/* register_by_**** から呼び出された場合ユーザーから入力された値を優先 */
	if (req.error_messages) {
		data.title  = req.body.title;
		data.author = req.body.author;
		data.circle = req.body.circle;
		data.url    = req.body.url;
		data.error_messages = req.error_messages;
	}

	res.render('doujin/register_top', data);
};

/* 同人誌の登録処理 */
DoujinController.prototype.register_by_user = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var title       = req.body.title;
	var author      = req.body.author;
	var circle      = req.body.circle;
	var url         = req.body.url;

	/* 入力値チェック */
	var error_messages = [];

	if(title.length === 0){
		error_messages.push('小説名を入力してください。');
	}

	if(title.length > 255){
		error_messages.push('小説名が長過ぎます。');
	}

	if(author.length > 255){
		error_messages.push('著者名が長過ぎます。');
	}

	if(circle.length > 255){
		error_messages.push('サークル名が長すぎます。');
	}

	if(url.length > 255){
		error_messages.push('URLが長すぎます。');
	}

	if(url.length > 0 && !/^https?:\/\/.*$/.test(url)){
		error_messages.push('正しいURLを入力してください。');
	}

	/* 入力ミスがあれば */
	if (error_messages.length) {
		req.error_messages = error_messages;
		DoujinController.prototype.register_top(req, res, next);
		return;
	}

	var thumbnail = '';
	var cover_image = '';
	/* ユーザー画像の変更があれば */
	if(req.file){
		var thumbnail_name = 's_' + req.file.filename;

		/* 画像を縮小 */
		fs.writeFileSync('./public/img/doujin/' + thumbnail_name, imagemagick.convert({
			srcData: fs.readFileSync(req.file.path),
			width: 150,
			height: 150,
			resizeStyle: 'aspectfit',
		}));

		cover_image = 'doujin/' + req.file.filename;
		thumbnail   = 'doujin/' + thumbnail_name;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* 作品の登録 */
	knex('doujinshi').insert({
			'title': title,
			'author': author,
			'circle': circle,
			'url': url,
			'thumbnail': thumbnail,
			'cover_image': cover_image,
			/* どこから登録されたか */
			'register_by': 'user',
			'create_time': now,
			'update_time': now
	})
	.then(function(doujinshi_id) {
		res.redirect(BASE_PATH + 'doujin/i/' + doujinshi_id);
	})
	.catch(function(err) {
		next(err);
	});
};

/* 東方創想話から同人誌登録 */
DoujinController.prototype.register_by_coolier = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var url         = req.body.url;

	/* 入力値チェック */
	var error_messages = [];

	if(!external_doujin_info.is_coolier_url(url)){
		error_messages.push('東方創想話のURLではないようです。');
	}

	/* 入力ミスがあれば */
	if (error_messages.length) {
		req.error_messages = error_messages;
		DoujinController.prototype.register_top(req, res, next);
		return;
	}


	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* 作品の登録 */
	external_doujin_info
	.get_by_coolier(url)
	.then(function(data) {
		return knex('doujinshi').insert({
			'title': data.title,
			'author': data.author,
			'circle': data.circle,
			'url': data.url,
			'thumbnail': data.thumbnail,
			'cover_image': data.cover_image,
			/* どこから登録されたか */
			'register_by': 'coolier',
			'create_time': now,
			'update_time': now
		});
	})
	.then(function(doujinshi_id) {
		res.redirect(BASE_PATH + 'doujin/i/' + doujinshi_id);
	})
	.catch(function(err) {
		next(err);
	});
};

/* メロンブックスから同人誌登録 */
DoujinController.prototype.register_by_melonbooks = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var url         = req.body.url;

	/* TODO:入力値チェック */
	if(!external_doujin_info.is_melonbooks_url(url)){
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* 作品の登録 */
	external_doujin_info
	.get_by_melonbooks(url)
	.then(function(data) {
		return knex('doujinshi').insert({
			'title': data.title,
			'author': data.author,
			'circle': data.circle,
			'url': data.url,
			'thumbnail': data.thumbnail,
			'cover_image': data.cover_image,
			/* どこから登録されたか */
			'register_by': 'melonbooks',
			'create_time': now,
			'update_time': now
		});
	})
	.then(function(doujinshi_id) {
		res.redirect(BASE_PATH + 'doujin/i/' + doujinshi_id);
	})
	.catch(function(err) {
		next(new Error(err));
	});
};

/* pixiv小説から同人誌登録 */
DoujinController.prototype.register_by_pixiv = function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var url         = req.body.url;

	/* TODO:入力値チェック */
	if(!external_doujin_info.is_pixiv_url(url)){
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* 作品の登録 */
	external_doujin_info
	.get_by_pixiv(url)
	.then(function(data) {
		return knex('doujinshi').insert({
			'title': data.title,
			'author': data.author,
			'circle': data.circle,
			'url': data.url,
			'thumbnail': data.thumbnail,
			'cover_image': data.cover_image,
			/* どこから登録されたか */
			'register_by': 'pixiv',
			'create_time': now,
			'update_time': now
		});
	})
	.then(function(doujinshi_id) {
		res.redirect(BASE_PATH + 'doujin/i/' + doujinshi_id);
	})
	.catch(function(err) {
		next(new Error(err));
	});
};

module.exports = DoujinController;
