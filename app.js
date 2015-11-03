/* 環境変数の確認 */
if (!process.env.TWITTER_CONSUMER_KEY){
	console.log('TWITTER_CONSUMER_KEY を環境変数に指定してください。');
	throw new Error();
}
if (!process.env.TWITTER_CONSUMER_SECRET){
	console.log('TWITTER_CONSUMER_SECRET を環境変数に指定してください。');
	throw new Error();
}

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MemcachedStore = require('connect-memcached')(session);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

/* MYSQLコネクション用モジュール */
var mysql_activerecord = require('mysql-activerecord');

/* PHPでいうところのvar_dump 的なのを使いたい */
var util = require('util');

/* Config を読み込む */
var conf = require('config');
//console.log(conf.twitter.api_key);
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 静的ファイルを置く場所
app.use(express.static(path.join(__dirname, 'public')));

// MySQLに接続
// TODO:コネクションの再接続
DB = new mysql_activerecord.Adapter({
  server: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'doujinshi',
  reconnectTimeout: 2000
});

BASE_PATH = 'http://sai-chan.com:3500/';

passport.use(new TwitterStrategy(
	{
		consumerKey: process.env.TWITTER_CONSUMER_KEY,
		consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
		callbackURL: BASE_PATH + "auth/twitter/callback"
	},
	function(token, tokenSecret, profile, done) {
		console.log('token:' + token);
		console.log('tokensecret:' + tokenSecret);

		/* ここでユーザーが存在するかしないかチェックする */
		DB.select('id');
		DB.where('twitter_id', profile.id);
		DB.get('user_twitter', function (err, rows, fields) {
			/* ユーザーが既に存在するか */
			var is_exists_user = rows instanceof Array && rows.length > 0;

			/* DEBUG */
			console.log(DB._last_query());
			console.log(err);

			/* ユーザーID */
			var user_id;


			/* ユーザーが既に存在していれば */
			if (is_exists_user){

				/* ユーザーID */
				user_id = rows[0].id;

				/* Twitterトークンを最新に更新しておく */
				DB.where('twitter_id', profile.id);
				DB.update('user_twitter',
					{
						consumer_key: token,
						consumer_secret: tokenSecret
					},
					function (err, rows, fields){
						/* DEBUG */
						console.log(DB._last_query());
						console.log(err);
						done(null, user_id);
					}
				);
			}
			else{
				/* 現在時刻 */
				require('date-utils');
				var dt = new Date();
				var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

				/* TODO: 同期処理でなく非同期処理にしたい… */
				Promise.resolve()
				.then(function(){
					return new Promise(function(resolve, reject){
						/* ユーザーテーブルに登録 */
						DB.insert('user', {
								displayname: profile.displayName,
								create_time: now,
								update_time: now
							},
							function (err, info) {
								/* DEBUG */
								console.log(DB._last_query());
								console.log(err);

								/* ユーザーID */
								user_id = info.insertId;

								/* つぎのthenへ */
								resolve();
							}
						);
					});
				})
				.then(function(){
					return new Promise(function(resolve, reject){
						/* ツイッターテーブルに登録 */
						DB.insert('user_twitter', {
								id: user_id,
								twitter_id: profile.id,
								consumer_key: token,
								consumer_secret: tokenSecret,
								create_time: now,
								update_time: now
							},
							function (err, info) {
								/* DEBUG */
								console.log(DB._last_query());
								console.log(err);

								/* つぎのthenへ */
								resolve();
							}
						);
					});
				})
				.then(function(){
					done(null, user_id);
				});
			}
		});
		/* ユーザー認証に失敗 */
		// done(null, false);
	}
));

/* パスポート用(アトで調査する) */
passport.serializeUser(function(user_id, done) {
	done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
	/* obj にはserialize 時のデータが入ってる */
	console.log('deserializeUser');
	done(null, user_id);
});



app.use(session({
	secret: "hogesecret",
	key: 'sid',
	cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}, // 1week
	store: new MemcachedStore({hosts: ['localhost:11211']})
}));
app.use(passport.initialize()); // passportの初期化処理
app.use(passport.session()); // passportのsessionを設定(中身はしらぬ)
// -- 追加ココまで --


// indexページ
var routes      = require('./routes/index');
app.use('/', routes);

// 同人誌一覧
var doujin      = require('./routes/doujin');
app.use('/doujin', doujin);

// 感想一覧
var impression  = require('./routes/impression');
app.use('/impression', impression);

// ユーザーページ・マイページ・ユーザー一覧
var user = require('./routes/user');
app.use('/user', user);

// ヘルプ
var help = require('./routes/help');
app.use('/help', help);

// 検索
var search = require('./routes/search');
app.use('/search', search);

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


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
