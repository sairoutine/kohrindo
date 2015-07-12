var express = require('express');
var router = express.Router();

/* TOP ページ */
router.get('/', function(req, res, next) {
	/* viewに渡す変数 */
	data = {};
	res.render('index', data);
});

module.exports = router;
