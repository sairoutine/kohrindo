
var express = require('express');
var router = express.Router();

/* ユーザーの一覧 */
/*
router.get('/list/:id', function(req, res, next) {
 	// viewに渡すパラメータ
	var data = {};

	// 認証しているか否か
	data.isAuthenticated = req.isAuthenticated();

	DB.select('*');
	DB.get('user', function (err, rows, fields) {
		data.list = rows;
		res.render('user/list', data);
	});
});
*/
/* マイページ */
/*
router.get('/mypage', function(req, res, next) {
	var data ={};

	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}
	console.log(req.user);

	DB.select('*');
	DB.where('id', req.user);
	DB.get('user', function (err, rows, fields) {
		data.user = rows[0];
		res.render('user/mypage', data);
	});

});
*/



/* ユーザーのプロフィール編集ページ */
router.get('/edit_top', function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data ={};

	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	DB.select('*');
	DB.where('id', req.user);
	DB.get('user', function (err, rows, fields) {
		data.user = rows[0];
		res.render('user/edit_top', data);
	});

});


/* ユーザーのプロフィール編集 */
router.post('/edit', function(req, res, next) {

	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}
 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	/* 入力値チェック */
	if(req.body.displayname.length ===0){
		res.redirect(BASE_PATH + 'user/edit_top');
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* データベース登録処理 */
	DB.where('id', req.user);
	DB.update('user',{
		displayname: req.body.displayname
	}, function (err, info) {
		/* DEBUG */
		console.log(DB._last_query());
		console.log(err);
		res.redirect(BASE_PATH + 'user/edit_top');
	});
});

/* 他ユーザーのマイページ */
router.get('/i/:id', function(req, res, next) {
	var user_id = req.params.id;
	var data ={};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	DB.select('*');
	DB.where('id', user_id);
	DB.get('user', function (err, rows, fields) {
		data.user = rows[0];
		res.render('user/i', data);
	});

});

module.exports = router;
