'use strict';
var imagemagick = require('imagemagick-native');
var fs = require('fs');
var util = require('util');
var moment= require('moment');
var Promise = require('bluebird');
var config = require('config');
var BASE_PATH = config.site.base_url;

var knex = require('../lib/knex');

var RedisModel = require('../model/redis');

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
	var data ={
		// エラーメッセージ
		error_messages: [],
	};

	knex.select('displayname', 'thumbnail', 'url', 'introduction')
	.from('user')
	.where('id', req.user)
	.then(function(rows) {
		data.user = rows[0];

		/* edit から呼び出された場合 */
		if (req.error_messages) {
			data.user.displayname = req.body.displayname;
			data.user.url         = req.body.url;
			data.user.introduction= req.body.introduction;
			data.error_messages = req.error_messages;
		}

		res.render('user/edit_top', data);
	})
	.catch(function(err) {
		next(err);
	});
};

/* ユーザーのプロフィール編集 */
UserController.prototype.edit = function(req, res, next) {
	/* 入力値 */
	var update_data = {
		displayname:  req.body.displayname,
		url:          req.body.url,
		introduction: req.body.introduction,
	};

	/* 入力値チェック */
	var error_messages = [];

	if(update_data.displayname.length === 0){
		error_messages.push('ニックネームが入力されていません。');
	}

	if(update_data.displayname.length > 255){
		error_messages.push('ニックネームが長過ぎます。');
	}

	if(update_data.url.length > 255){
		error_messages.push('URLが長すぎます。');
	}

	if(update_data.url.length > 0 && !/^https?:\/\/.*$/.test(update_data.url)){
		error_messages.push('正しいURLを入力してください。');
	}

	if(update_data.introduction.length > 400){
		error_messages.push('自己紹介は400文字までにしてください。');
	}

	/* 入力ミスがあれば */
	if (error_messages.length) {
		req.error_messages = error_messages;
		UserController.prototype.edit_top(req, res, next);
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

	/* create_time, update_time カラム用 */
	update_data.update_time = moment().format("YYYY-MM-DD HH:mm:ss");

	knex('user')
	.where('id', req.user)
	.update(update_data)
	.then(function(rows) {
		return RedisModel.set_user_notification(req.user, 'success', 'プロフィールの編集が完了しました！');
	})
	.then(function(){
		res.redirect(BASE_PATH + 'user/i/' + req.user);
	})
	.catch(function(err) {
		next(err);
	});
};

/* 他ユーザーのマイページ */
UserController.prototype.i = function(req, res, next) {
	/* マイページに表示する感想件数 */
	var limit_num = 4;

	var user_id = req.params.id;
	var data ={};

	/* ユーザー情報を取得 */
	knex.select('displayname', 'thumbnail', 'url', 'introduction')
	.from('user')
	.where('id', user_id)
	.then(function(user_rows) {
		/* 存在しないuser_id */
		if(user_rows.length === 0) {
			res.redirect(BASE_PATH);
			return Promise.reject(new Error('Invalid user_id: ' + user_id));
		}

		data.user  = user_rows[0];

		/* 最近投稿した感想情報を取得 */
		return knex.select('doujinshi_id')
		.from('impression')
		.where('user_id', user_id)
		.orderBy('id', 'desc')
		.limit(limit_num)
		.offset(0);
	})
	.then(function(impression_rows) {
		var doujinshi_ids = [];

		impression_rows.forEach(function(row) {
			doujinshi_ids.push(row.doujinshi_id);
		});

		/* 最近投稿した感想の同人誌情報を取得 */
		return knex.select('id', 'title', 'author', 'circle', 'url', 'thumbnail')
		.from('doujinshi')
		.whereIn('id', doujinshi_ids);
	})
	.then(function(doujinshi_rows) {
		data.doujinshi = doujinshi_rows;

		res.render('user/i', data);
	})
	.catch(function(err_message) {
		next(err_message);
	});
};

module.exports = UserController;
