var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({
	dest: './public/img/user',
    limits: {
        fieldNameSize: 50,
        files: 1,
        fields: 5,
        fileSize: 50 * 1024 * 1024 // Max 50MB
    },
});

var UserController = require('../controller/user');
var user = new UserController();

/* TODO: ユーザーの一覧 */

/* ユーザーのプロフィール編集ページ */
router.get('/edit_top', user.edit_top);

/* ユーザーのプロフィール編集 */
router.post('/edit', upload.single('thumbnail'), user.edit);

/* 他ユーザーのマイページ */
router.get('/i/:id', user.i);

module.exports = router;
