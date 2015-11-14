var express = require('express');
var router = express.Router();

var IndexController = require('../controller/index');
var index = new IndexController();

/* indexページ */
router.get('/', index.index);

module.exports = router;
