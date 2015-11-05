var express = require('express');
var router = express.Router();

var knex = require('../lib/knex');
/* indexページ */
router.get('/', function(req, res, next) {
	/* 1ページに表示する感想件数 */
	var limit_num = 5;

 	/* viewに渡すパラメータ */
	var data = {
		/* ログイン後のユーザー情報 */
		mydata: {},
		/* 最近投稿された感想 */
		impression: []
	};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();


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

		/* 認証してなければそのまま描画 */
		if(!req.isAuthenticated()) {
			res.render('index', data);
			return;
		}

		/* 以下、ユーザーデータの取得 */
		knex.select(
			knex.raw('count(*) as impression_num')
		)
		.from('impression')
		.where('user_id', req.user)
		.then(function(rows) {
			data.mydata.impression_num = rows[0].impression_num;

			return knex.select('displayname', 'thumbnail')
			.from('user')
			.where('id', req.user);
		})
		.then(function(rows) {
			data.mydata.profile = rows[0];

			res.render('index', data);
		})
		.catch(function(err) {
			next(err);
		});
	})
	.catch(function(err) {
		next(err);
	});
});


module.exports = router;
