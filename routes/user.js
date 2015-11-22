'use strict';

var config = require('config');
var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({
	dest: './public/img/user',
    limits: config.upload.limits,
});

/* ログイン必須のページかどうか */
var must_authenticated = require('../middleware/must_authenticated');

var UserController = require('../controller/user');
var user = new UserController();

/* TODO: ユーザーの一覧 */

/* ユーザーのプロフィール編集ページ */
router.get('/edit_top', must_authenticated, user.edit_top);

/* ユーザーのプロフィール編集 */
router.post('/edit', must_authenticated, upload.single('thumbnail'), user.edit);

/* 他ユーザーのマイページ */
router.get('/i/:id', user.i);

module.exports = router;
