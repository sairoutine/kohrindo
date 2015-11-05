
var express = require('express');
var router = express.Router();

var knex = require('../lib/knex');
/* 検索 */
router.get('/', function(req, res, next) {
 	/* viewに渡すパラメータ */
	var data = {};

	/* 認証しているか否か */
	data.isAuthenticated = req.isAuthenticated();

	res.render('search/index', data);
});

module.exports = router;
