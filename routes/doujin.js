var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({
	dest: './public/img/doujin',
    limits: {
        fieldNameSize: 50,
        files: 1,
        fields: 5,
        fileSize: 50 * 1024 * 1024
    },
});

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
router.get('/edit_top/:id', doujin.edit_top);

/* 同人誌の編集処理 */
router.post('/edit', upload.single('cover_image'), doujin.edit);

/* 同人誌の登録のための入力画面 */
router.get('/register_top', doujin.register_top);

/* ユーザーによる同人誌登録 */
router.post('/register_by_user', upload.single('cover_image'), doujin.register_by_user);

/* 東方創想話から同人誌登録 */
router.post('/register_by_coolier', doujin.register_by_coolier);

/* メロンブックスから同人誌登録 */
router.post('/register_by_melonbooks', doujin.register_by_melonbooks);

/* pixiv小説から同人誌登録 */
router.post('/register_by_pixiv', doujin.register_by_pixiv);

module.exports = router;
