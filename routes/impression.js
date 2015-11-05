
var express = require('express');
var router = express.Router();

/* 感想一覧 */
router.get('/list', function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	res.render('impression/list', data);
});

/* 感想の個別ページ */
router.get('/i/:id', function(req, res, next) {
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
});

/* 感想の登録のための入力画面 */
/*
router.get('/register_top', function(req, res, next) {
	var data = {};

	data.isAuthenticated = req.isAuthenticated();
	res.render('impression/register_top', data);
});
*/

/* 感想登録処理 */
router.post('/register', function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var doujinshi_id = req.body.id;
	var body         = req.body.body;
	var user_id      = req.user;

	/* 入力に誤りがあるときに呼び出す関数 */
	var input_error = function(error_message) {
	 	/* viewに渡すパラメータ */
		var data = {
			'id': doujinshi_id,
			'body': body,
			isAuthenticated: req.isAuthenticated()
		};
		res.render('/doujin/i', data);
	};

	/* 入力値チェック */
	if(body.length === 0){
		input_error('本文が入力されていません。');
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
	.then(function(impression_id) {
		res.redirect(BASE_PATH + 'doujin/i/' + doujinshi_id);
	})
	.catch(function(err) {
		next(new Error(err));
	});
});

/* 感想の登録のための入力画面 */
router.get('/register_top', function(req, res, next) {
	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();
	res.render('impression/register_top', data);
});

/* 感想登録処理 */
router.post('/register/:id', function(req, res, next) {
	var doujinshi_id = req.params.id;

	/* viewに渡すパラメータ */
	var data = {};

	/* 入力値チェック */
	if(req.body.article.length === 0){
		res.redirect(BASE_PATH + 'impression/' + doujinshi_id);
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* データベース登録処理 */
	DB.insert('impression', {
			"doujinshi_id": doujinshi_id,
			article: req.body.article,
			create_time: now,
			update_time: now
		},
		function (err, info) {
			/* DEBUG */
			console.log(DB._last_query());
			res.redirect(BASE_PATH + 'impression/' + doujinshi_id);
		}
	);
});

/* 感想の編集のための入力画面 */
/*
router.get('/edit_top', function(req, res, next) {
	// viewに渡すパラメータ
	var data = {};

	data.isAuthenticated = req.isAuthenticated();
	res.render('impression/register_top', data);
});
*/
/* 感想編集処理 */
router.post('/edit/:id', function(req, res, next) {
	var doujinshi_id = req.params.id;

	/* viewに渡すパラメータ */
	var data = {};

	/* 入力値チェック */
	if(req.body.article.length === 0){
		res.redirect(BASE_PATH + 'impression/' + doujinshi_id);
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* データベース登録処理 */
	DB.insert('impression', {
			"doujinshi_id": doujinshi_id,
			article: req.body.article,
			create_time: now,
			update_time: now
		},
		function (err, info) {
			/* DEBUG */
			console.log(DB._last_query());
			res.redirect(BASE_PATH + 'impression/' + doujinshi_id);
		}
	);
});


module.exports = router;
