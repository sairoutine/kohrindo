
var express = require('express');
var router = express.Router();

/* 同人誌の一覧 */
/* :id ページング用 */
router.get('/list', function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	DB.select('*');
	DB.get('doujinshi', function (err, rows, fields) {
		data.list = rows;
		res.render('doujin/list', data);
	});
});

/* 同人誌の個別ページ */
/* :id 同人誌のID */
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
		res.render('doujin/i', data);
	});
});

/* 同人誌の編集のための入力画面 */
/* :id 同人誌ID */
router.get('/edit_top', function(req, res, next) {
	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	res.render('doujin/edit_top', data);
});

/* 同人誌の登録のための入力画面 */
router.get('/register_top', function(req, res, next) {
	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();
	res.render('doujin/register_top', data);
});

/* 同人誌の登録処理 */
router.post('/register_by_user', function(req, res, next) {

	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* viewに渡すパラメータ */
	var data = {};

	/* 入力値チェック */
	if(req.body.title.length ===0 || req.body.author.length === 0){
		res.redirect(BASE_PATH + 'doujin/list');
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* データベース登録処理 */
	DB.insert('doujinshi', {title: req.body.title, author: req.body.author, create_time: now, update_time: now}, function (err, info) {
		/* DEBUG */
		console.log(DB._last_query());
		res.redirect(BASE_PATH + 'doujin/list/');
	});
});

/* クーリエから同人誌登録 */
router.get('/register_by_coolier', function(req, res, next) {
	res.redirect(BASE_PATH + 'doujin/list/');
});

module.exports = router;
