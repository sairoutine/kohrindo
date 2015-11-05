
var express = require('express');
var router = express.Router();
var multer = require('multer');

var upload = multer({ dest: '../tmp/images/'});

var fs = require('fs');

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
});


/* ユーザーのプロフィール編集 */
router.post('/edit', upload.single('thumbnail'), function(req, res, next) {

	/* 認証処理 */
	if(!req.isAuthenticated()) {
	   res.redirect(BASE_PATH);
	}

	/* 入力値 */
	var displayname = req.body.displayname;
	var url         = req.body.url;
	var introduction= req.body.introduction;

	/* 入力に誤りがあるときに呼び出す関数 */
	var input_error = function(error_message) {
	 	/* viewに渡すパラメータ */
		var data = {
			'displayname': displayname,
			'url': url,
			'introduction': introduction,
			'error_message': error_message,
			isAuthenticated: req.isAuthenticated()
		};
		res.render('user/edit_top', data);
	};

	/* 入力値チェック */
	if(req.body.displayname.length === 0){
		input_error('ニックネームが入力されていません。');
		return;
	}

	var thumbnail = 'noimage.gif';
	if(req.file){
		var target_path, tmp_path;
		tmp_path = req.file.path;

		// 拡張子なんとかしなくちゃ
		target_path = './public/img/user/' + req.user + '.gif';
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

		thumbnail = 'user/' + req.user + '.gif';
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	knex('user')
	.where('id', req.user)
	.update({
		'displayname': displayname,
		'thumbnail': thumbnail,
		'url': url,
		'introduction': introduction,
		'update_time': now
	})
	.then(function(rows) {
		res.redirect(BASE_PATH + 'user/edit_top');
	})
	.catch(function(err) {
		next(new Error(err));
	});
});

/* 他ユーザーのマイページ */
router.get('/i/:id', function(req, res, next) {
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

});

module.exports = router;
