'use strict';
/* 環境変数の確認 */
if (!process.env.TWITTER_CONSUMER_KEY){
	throw new Error('TWITTER_CONSUMER_KEY を環境変数に指定してください。');
}
if (!process.env.TWITTER_CONSUMER_SECRET){
	throw new Error('TWITTER_CONSUMER_SECRET を環境変数に指定してください。');
}
if (!process.env.SESSION_SECRET){
	throw new Error('SESSION_SECRET を環境変数に指定してください。');
}
if (!process.env.SLACK_INCOMING_WEBHOOK){
	throw new Error('SLACK_INCOMING_WEBHOOK を環境変数に指定してください。');
}

var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var config = require('config');
var crypto = require('crypto');
var request = require('request');
var fs = require('fs');
var moment = require('moment');

var knex = require('./lib/knex');
var log = require('./lib/logger');

var app = express();

// Config の取得
var BASE_PATH = config.site.base_url;

// Viewの設定
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// faviconの設定
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 静的ファイルを置く場所
app.use(express.static(path.join(__dirname, 'public')));

passport.use(new TwitterStrategy({
		consumerKey: process.env.TWITTER_CONSUMER_KEY,
		consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
		callbackURL: BASE_PATH + "auth/twitter/callback"
	}, function(token, tokenSecret, profile, done) {
		/* ユーザーID */
		var user_id;

		/* ここでユーザーが存在するかしないかチェックする */
		knex.select('id')
		.from('user_twitter')
		.where('twitter_id', profile.id)
		.then(function(rows) {
			/* ユーザーが既に存在していれば */
			if (rows.length > 0){
				user_id = rows[0].id;

				/* Twitterトークンを最新に更新しておく */
				return knex('user_twitter')
				.update({
						consumer_key: token,
						consumer_secret: tokenSecret
				})
				.where('twitter_id', profile.id);
			}
			else{ /* ユーザーが存在してなければユーザー登録処理 */
				/* 現在時刻 */
				var now = moment().format("YYYY-MM-DD HH:mm:ss");

				/* TODO:拡張子はpath.extname から取得する */
				// 画像保存用に画像IDからsha1値を計算
				var randam_string = crypto.pseudoRandomBytes(16).toString('hex');

				// 画像パス
				var thumbnail = 'user/' + randam_string + '.png';

				// 画像を取得して保存
				request.get(profile._json.profile_image_url)
				.on('error', function(err) {
					throw err;
				})
				.pipe(fs.createWriteStream('./public/img/' + thumbnail));

				return knex('user').insert({
					displayname: profile.displayName,
					introduction: profile._json.description,
					url: profile._json.url,
					thumbnail: thumbnail,
					create_time: now,
					update_time: now
				})
				.then(function (id) {
					user_id = id;

					/* ツイッターテーブルに登録 */
					return knex('user_twitter')
					.insert({
						id: user_id,
						twitter_id: profile.id,
						consumer_key: token,
						consumer_secret: tokenSecret,
						create_time: now,
						update_time: now
					});
				});
			}
		})
		.then(function(){
			done(null, user_id);
		})
		.catch(function(err) {
			done(err,null);
		});
	}
));

/* パスポート用(アトで調査する) */
passport.serializeUser(function(user_id, done) {
	done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
	/* obj にはserialize 時のデータが入ってる */
	done(null, user_id);
});



app.use(session({
	/* 環境変数から取得する */
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	key: 'sid',
	cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}, // 1week
	store: new RedisStore({
		host: config.redis.host,
		port: config.redis.port,
		prefix: 'kohrindo:session:'
	})
}));
app.use(passport.initialize()); // passportの初期化処理
app.use(passport.session()); // passportのsessionを設定(中身はしらぬ)

// res.render のオーバーライド
var override_render = require('./middleware/override-render');
app.use(override_render);

// routes ディレクトリ以下のjsをルーティング
fs.readdirSync('./routes')
.filter(function(file){
	return /.*\.js$/.test(file);
})
.forEach(function (file) {
	var basename = path.basename(file, '.js');
	var require_file = './' + path.join('./routes', basename);

	var route = basename === 'index' ? '/' : '/' + basename;
	app.use(route, require(require_file));
});

// ツイッター認証ページ
app.get("/auth/twitter", passport.authenticate('twitter'));

// Twitterからcallbackうける
app.get("/auth/twitter/callback", passport.authenticate('twitter', {
	successRedirect: '/',
	 failureRedirect: '/'
}));

// ログアウト
app.get("/auth/logout", function(req, res){
	req.logout();
	res.redirect("/");
});


// 404エラー
app.use(function(req, res, next) {
	var user_id = req.isAuthenticated() ? req.user : 0;
	log.error({
		user_id: user_id,
		path: req.originalUrl,
		message: '404 Not Found',
	});

	res.status(404);
	res.render('404', {});
});

// 500エラー
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		var user_id = req.isAuthenticated() ? req.user : 0;
		log.error({
			user_id: user_id,
			path: req.originalUrl,
			message: err.stack,
		});

		// 既にredirectとかされてたら何もしない
		if(res.headersSent) return;

		res.status(err.status || 500);
		res.render('500_development', {
			message: err.message,
			error: err
		});
	});
}
else {
	app.use(function(err, req, res, next) {
		var user_id = req.isAuthenticated() ? req.user : 0;
		log.error({
			user_id: user_id,
			path: req.originalUrl,
			message: err.stack,
		});

		// 既にredirectとかされてたら何もしない
		if(res.headersSent) return;

		res.status(err.status || 500);
		res.render('500', {});
	});
}

module.exports = app;
