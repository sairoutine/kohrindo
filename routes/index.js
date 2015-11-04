var express = require('express');
var router = express.Router();

/* indexページ */
router.get('/', function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	/* 感想数 */
	knex.select(
		knex.raw('count(*) as impression_num')
	)
	.from('impression')
	.then(function(rows) {
		data.impression_num = rows[0].impression_num;
		res.render('index', data);
	})
	.catch(function(err_message) {
		next(new Error(err_message));
	});
});


module.exports = router;
