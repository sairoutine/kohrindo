
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
	var doujinshi_id = req.params.id;
	var data ={};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	new Promise(function(resolve){
		DB.select('*');
		DB.where('id', doujinshi_id);
		DB.get('doujinshi', function (err, rows, fields) {
			doujinshi_data = rows[0];

			data.id    = doujinshi_data.id;
			data.title = doujinshi_data.title;
			data.author= doujinshi_data.author;

			/* DEBUG */
			console.log(DB._last_query());
			/* then の処理に飛ぶ */
			resolve();
		});

	}).then(function(){
		return new Promise(function(resolve){
			DB.select('*');
			DB.where('doujinshi_id', doujinshi_id);
			DB.get('impression', function (err, rows, fields) {
				data.impression = rows;

				/* DEBUG */
				console.log(DB._last_query());
				/* then の処理に飛ぶ */
				resolve();
			});
		});
	}).then(function(){
		res.render('impression/i', data);
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
