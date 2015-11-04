
var express = require('express');
var router = express.Router();
var multer = require('multer');

var upload = multer({ dest: '../tmp/images/'});

var fs = require('fs');

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
	var data = {
		'title': '',
		'author': '',
		'circle': '',
		'url': '',
		'body': '',
		isAuthenticated: req.isAuthenticated()
	};

	res.render('doujin/register_top', data);
});

/* 同人誌の登録処理 */
router.post('/register_by_user', upload.single('cover_image'), function(req, res, next) {
	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var title       = req.body.title;
	var author      = req.body.author;
	var circle      = req.body.circle;
	var url         = req.body.url;
	var body        = req.body.body;

	/* 入力に誤りがあるときに呼び出す関数 */
	var input_error = function(error_message) {
	 	/* viewに渡すパラメータ */
		var data = {
			'title': title,
			'author': author,
			'circle': circle,
			'url': url,
			'body': body,
			isAuthenticated: req.isAuthenticated()
		};
		res.render('user/register_top', data);
	};

	/* 入力値チェック */
	if(title.length === 0){
		input_error('タイトルが入力されていません。');
		return;
	}

	var thumbnail = 'noimage.gif';
	var cover_image = 'noimage.gif';
	if(req.file){
		var target_path, tmp_path;
		tmp_path = req.file.path;

		// 拡張子なんとかしなくちゃ
		target_path = './public/img/doujin/' + req.user + '.gif';
		fs.rename(tmp_path, target_path, function(err) {
			if (err) {
				throw err;
			}
			fs.unlink(tmp_path, function() {
				if (err) {
					throw err;
				}
			});
		});

		thumbnail   = 'doujin/' + req.user + '.gif';
		cover_image = 'doujin/' + req.user + '.gif';
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
			'create_time': now,
			'update_time': now
	})
	.then(function(doujinshi_id) {
		knex('impression').insert({
				'doujinshi_id': doujinshi_id,
				'body': body,
				'create_time': now,
				'update_time': now
		})
		.then(function(impression_id) {
			res.redirect(BASE_PATH + 'impression/i/' + impression_id);
		})
		.catch(function(err) {
			next(new Error(err));
		});
	})
	.catch(function(err) {
		next(new Error(err));
	});
});

/* クーリエから同人誌登録 */
router.get('/register_by_coolier', function(req, res, next) {
	res.redirect(BASE_PATH + 'doujin/list/');
});

module.exports = router;
