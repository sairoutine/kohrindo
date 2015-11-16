'use strict';

var RedisModel = require('../model/redis');
var knex = require('../lib/knex');

// res.render メソッドをオーバーライドする。
// テンプレに渡す共通変数はここで定義する。

module.exports = function (req, res, next) {
	// SUPER::render
	var _render = res.render;

	/* ユーザーがログイン済かどうか */
	var isAuthenticated = req.isAuthenticated();

	/* res.render をオーバーライド */
	res.render = function(view, options, fn) {
		/* 認証しているか否か */
		options.isAuthenticated = isAuthenticated;

		/* ユーザーデータを追加する */
		options.mydata = {};

		/* ログインしてなければユーザーデータを追加しない */
		if(!isAuthenticated) {
        	_render.call(this, view, options, fn);
			return;
		}

		/* ユーザーの投稿数 */
		knex.select(
			knex.raw('count(*) as impression_num')
		)
		.from('impression')
		.where('user_id', req.user)
		.then(function(rows) {
			options.mydata.impression_num = rows[0].impression_num;

			/* ユーザー名とユーザー画像 */
			return knex.select('displayname', 'thumbnail')
			.from('user')
			.where('id', req.user);
		})
		.then(function(rows) {
			options.mydata.profile = rows[0];

			/* ユーザーへ通知するメッセージを取得 */
			return RedisModel.get_user_notification(req.user);
		})
		.then(function(messages){
			options.user_messages = messages;

			/* 一度ユーザーへ通知したメッセージは削除する */
			return RedisModel.delete_user_notification(req.user);
		})
		.then(function(){
			// call SUPER::render
			_render.call(res, view, options, fn);
		})
		.catch(function(err) {
			throw err;
		});

    };
    next();
};
