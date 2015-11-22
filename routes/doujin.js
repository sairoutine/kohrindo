'use strict';

var config = require('config');
var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({
	dest: './public/img/doujin',
	limits: config.upload.limits,
});

/* ログイン必須のページかどうか */
var must_authenticated = require('../middleware/must_authenticated');

var DoujinController = require('../controller/doujin');
var doujin = new DoujinController();

/* 同人誌の一覧 */
/* :id ページング用 */
router.get('/list', doujin.list);


/* 同人誌の個別ページ */
/* :id 同人誌のID */
router.get('/i/:id', doujin.i);

/* 同人誌の編集のための入力画面 */
/* :id 同人誌ID */
router.get('/edit_top/:id', must_authenticated, doujin.edit_top);

/* 同人誌の編集処理 */
router.post('/edit', must_authenticated, upload.single('cover_image'), doujin.edit);

/* 同人誌の登録のための入力画面 */
router.get('/register_top', must_authenticated, doujin.register_top);

/* ユーザーによる同人誌登録 */
router.post('/register_by_user', must_authenticated, upload.single('cover_image'), doujin.register_by_user);

/* 東方創想話から同人誌登録 */
router.post('/register_by_coolier', must_authenticated, doujin.register_by_coolier);

/* メロンブックスから同人誌登録 */
router.post('/register_by_melonbooks', must_authenticated, doujin.register_by_melonbooks);

/* pixiv小説から同人誌登録 */
router.post('/register_by_pixiv', must_authenticated, doujin.register_by_pixiv);

module.exports = router;
