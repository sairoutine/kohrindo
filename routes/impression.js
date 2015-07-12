var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* 同人誌感想の一覧 */
router.get('/list', function(req, res, next) {
	/* viewに渡すパラメータ */
	var data = {};
	data.title = '同人誌一覧';

	DB.select('*');
	DB.get('doujinshi', function (err, rows, fields) {
		data.list = rows;
		res.render('doujinshi/list', data);
	});
});

/* 同人誌の登録処理 */
router.post('/register', function(req, res, next) {
	/* viewに渡すパラメータ */
	var data = {};

	/* 入力値チェック */
	if(req.body.title.length ===0 || req.body.author.length === 0){
		res.redirect(BASE_PATH + 'list');
		return;
	}

	require('date-utils');

	var dt = new Date();
	var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

	/* データベース登録処理 */
	DB.insert('doujinshi', {title: req.body.title, author: req.body.author, create_time: now, update_time: now}, function (err, info) {
		/* DEBUG */
		console.log(DB._last_query());
		res.redirect(BASE_PATH + 'list');
	});
});


module.exports = router;
