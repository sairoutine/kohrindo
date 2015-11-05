
var express = require('express');
var router = express.Router();
var multer = require('multer');

var upload = multer({ dest: '../tmp/images/'});

var fs = require('fs');

/* 同人誌の一覧 */
/* :id ページング用 */
router.get('/list', function(req, res, next) {
	/* 1ページに表示する同人誌件数 */
	var limit_num = 12;

	var offset       = parseInt(req.query.page) || 0;

 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	/* 同人誌の感想一覧を取得 */
	knex.select('id', 'title', 'author', 'thumbnail')
	.from('doujinshi')
	.orderBy('id', 'desc')
	.limit(limit_num)
	.offset(offset * limit_num)
	.then(function(doujinshi_rows) {

		if(doujinshi_rows.length === 0) {
			/* TODO: Promisableにしたい */
			data.doujinshi = [];
			res.render('doujin/list', data);
			return;
		}

		/* 同人誌一覧をテンプレに渡す */
		data.doujinshi = doujinshi_rows;

		knex.count('* as doujinshi_num')
		.from('doujinshi')
		.then(function(rows) {
			/* ページング用 */
			data.pagination = {
				total_count: rows[0].doujinshi_num,
				page_size: limit_num,
				page_count: Math.ceil(rows[0].doujinshi_num / limit_num),
				current_page: offset,
				url: '/doujin/list/?page=',
			};

			res.render('doujin/list', data);
		})
		.catch(function(err_message) {
			next(new Error(err_message));
		});
	})
	.catch(function(err_message) {
		next(new Error(err_message));
	});
});

/* 同人誌の個別ページ */
/* :id 同人誌のID */
router.get('/i/:id', function(req, res, next) {
	/* 1ページに表示する感想件数 */
	var limit_num = 5;

	var doujinshi_id = req.params.id;
	var offset       = parseInt(req.query.page) || 0;

	/* view に渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	/* 同人誌情報 */
	knex.select(['title', 'author', 'circle', 'url', 'thumbnail'])
	.from('doujinshi')
	.where('id', doujinshi_id)
	.then(function(rows) {
		data.id        = doujinshi_id;
		data.title     = rows[0].title;
		data.author    = rows[0].author;
		data.circle    = rows[0].circle;
		data.url       = rows[0].url;
		data.thumbnail = rows[0].thumbnail;

		/* 同人誌の感想一覧を取得 */
		knex.select('id', 'user_id', 'body', 'create_time')
		.from('impression')
		.where('doujinshi_id', doujinshi_id)
		.orderBy('id', 'desc')
		.limit(limit_num)
		.offset(offset * limit_num)
		.then(function(impression_rows) {

			if(impression_rows.length === 0) {
				/* TODO: Promisableにしたい */
				data.impression = [];
				res.render('doujin/i', data);
				return;
			}

			/* IN句用にuser_id の配列を作成 */
			var user_ids = [];
			impression_rows.forEach(function(row) {
				user_ids.push(row.user_id);
			});

			/* 感想一覧のユーザー名を取得 */
			knex.select('id', 'displayname')
			.from('user')
			.whereIn('id', user_ids)
			.then(function(user_rows) {
				/* user_id -> displayname の連想配列を作成 */
				var user_id_displayname_hash = {};
				user_rows.forEach(function(row) {
					user_id_displayname_hash[row.id] = row.displayname;
				});

				/* impression_rows に displayname を追加 */
				for(var i=0; i<impression_rows.length; i++) {
					impression_rows[i].displayname = user_id_displayname_hash[impression_rows[i].user_id];
				}

				/* 感想一覧をテンプレに渡す */
				data.impression = impression_rows;

				knex.count('* as impression_num')
				.from('impression')
				.where('doujinshi_id', doujinshi_id)
				.then(function(rows) {
					/* ページング用 */
					data.pagination = {
						total_count: rows[0].impression_num,
						page_size: limit_num,
						page_count: Math.ceil(rows[0].impression_num / limit_num),
						current_page: offset,
						url: '/doujin/i/' + doujinshi_id + '?page=',
					};

					res.render('doujin/i', data);
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
	})
	.catch(function(err_message) {
		next(new Error(err_message));
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
				'user_id': req.user,
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
