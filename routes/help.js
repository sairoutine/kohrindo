
var express = require('express');
var router = express.Router();

var knex = require('../lib/knex');
/* 同人誌の一覧 */
router.get('/', function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	res.render('help/index', data);
});

module.exports = router;
