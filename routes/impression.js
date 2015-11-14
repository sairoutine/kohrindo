
var express = require('express');
var router = express.Router();

var ImpressionController = require('../controller/impression');
var impression = new ImpressionController();

/* 感想一覧 */
router.get('/list', impression.list);

/* 感想の個別ページ */
router.get('/i/:id', impression.i);

/* 感想登録処理 */
router.post('/register', impression.register);

/* 感想編集処理 */
router.post('/edit', impression.edit);

module.exports = router;
