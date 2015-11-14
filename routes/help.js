
var express = require('express');
var router = express.Router();

var HelpController = require('../controller/help');
var help = new HelpController();

/* ヘルプ */
router.get('/', help.index);

module.exports = router;
