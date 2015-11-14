
var express = require('express');
var router = express.Router();

var SearchController = require('../controller/search');
var search = new SearchController();

/* 検索 */
router.get('/', search.index);

module.exports = router;
