'use strict';
var express = require('express');
var router = express.Router();

var HelpController = require('../controller/help');
var help = new HelpController();

/* ヘルプ */
router.get('/', help.index);

/* ご意見・ご要望の投稿 */
router.post('/contact', help.contact);


module.exports = router;
