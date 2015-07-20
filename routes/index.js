var express = require('express');
var router = express.Router();

/* indexページ */
router.get('/', function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	/* 感想数 */
	DB.select('count(*) as impression_num', false);
	DB.get('impression', function (err, rows, fields) {
		data.impression_num = rows[0].impression_num;
		res.render('index', data);
	});
});


module.exports = router;
