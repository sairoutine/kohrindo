'use strict';

/* 認証処理 */

var config = require('config');
var BASE_PATH = config.site.base_url;
module.exports = function (req, res, next) {
	if(!req.isAuthenticated()) {
		/* ログインしてなかった場合 */
		res.redirect(BASE_PATH);
	}
	else{
		/* ログインしてた場合 */
		next();
	}
};
