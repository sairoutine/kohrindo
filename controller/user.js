var imagemagick = require('imagemagick-native');
var fs = require('fs');
var util = require('util');

var knex = require('../lib/knex');

var ControllerBase = require('./base');

// コンストラクタ
var UserController = function() {
	ControllerBase.apply(this,arguments);
};
// ControllerBaseを継承
util.inherits(UserController, ControllerBase);


/* ユーザーのプロフィール編集ページ */
UserController.prototype.edit_top = function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data ={};

	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	knex.select('displayname', 'thumbnail', 'url', 'introduction')
	.from('user')
	.where('id', req.user)
	.then(function(rows) {
		data.user = rows[0];
		res.render('user/edit_top', data);
	})
	.catch(function(err) {
		next(new Error(err));
	});
};

/* ユーザーのプロフィール編集 */
UserController.prototype.edit = function(req, res, next) {

	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var update_data = {
		displayname:  req.body.displayname,
		url:          req.body.url,
		introduction: req.body.introduction,
	};

	/* 入力に誤りがあるときに呼び出す関数 */
	var input_error = function(error_message) {
	 	/* viewに渡すパラメータ */
		var data = {
			'displayname':  update_data.displayname,
			'url':          update_data.url,
			'introduction': update_data.introduction,
			'error_message': error_message,
		};
		res.render('user/edit_top', data);
	};

	/* 入力値チェック */
	if(update_data.displayname.length === 0){
		input_error('ニックネームが入力されていません。');
		return;
	}

	/* ユーザー画像の変更があれば */
	if(req.file){
		var thumbnail_name = req.file.filename;

		// Stream処理にしたい……
		/* 画像を縮小 */
		fs.writeFileSync('./public/img/user/' + thumbnail_name, imagemagick.convert({
			srcData: fs.readFileSync(req.file.path),
			width: 150,
			height: 150,
			resizeStyle: 'aspectfit',
		}));

		update_data.thumbnail = 'user/' + thumbnail_name;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	knex('user')
	.where('id', req.user)
	.update(update_data)
	.then(function(rows) {
		res.redirect(BASE_PATH + 'user/edit_top');
	})
	.catch(function(err) {
		next(new Error(err));
	});
};

/* 他ユーザーのマイページ */
UserController.prototype.i = function(req, res, next) {
	/* マイページに表示する感想件数 */
	var limit_num = 4;

	var user_id = req.params.id;
	var data ={};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	/* ユーザー情報を取得 */
	knex.select('displayname', 'thumbnail', 'url', 'introduction')
	.from('user')
	.where('id', user_id)
	.then(function(user_rows) {
		data.user  = user_rows[0];

		/* 最近投稿した感想情報を取得 */
		knex.select('doujinshi_id')
		.from('impression')
		.where('user_id', user_id)
		.orderBy('id', 'desc')
		.limit(limit_num)
		.offset(0)
		.then(function(impression_rows) {
			var doujinshi_ids = [];

			impression_rows.forEach(function(row) {
				doujinshi_ids.push(row.doujinshi_id);
			});

			/* 最近投稿した感想の同人誌情報を取得 */
			knex.select('id', 'title', 'author', 'circle', 'url', 'thumbnail')
			.from('doujinshi')
			.whereIn('id', doujinshi_ids)
			.then(function(doujinshi_rows) {
				data.doujinshi = doujinshi_rows;

				res.render('user/i', data);
			})
			.catch(function(err_message) {
				next(new Error(err_message));
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

module.exports = UserController;
