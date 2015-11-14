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
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var crypto = require('crypto');
var request = require('request');
var fs = require('fs');

var knex = require('./lib/knex');
/* Config を読み込む */
var conf = require('config');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (app.get('env') === 'development') {
	app.use(logger('dev'));
}
else {
	app.use(logger('short'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 静的ファイルを置く場所
app.use(express.static(path.join(__dirname, 'public')));


BASE_PATH = 'http://sai-chan.com:3500/';

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
				require('date-utils');
				var dt = new Date();
				var now = dt.toFormat("YYYY-MM-DD HH24:MI:SS");

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
	secret: "hogesecret",
	resave: false,
	saveUninitialized: true,
	key: 'sid',
	cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}, // 1week
	store: new RedisStore({
		host: 'localhost',
		port: 6379,
		prefix: 'kohrindo:session:'
	})
}));
app.use(passport.initialize()); // passportの初期化処理
app.use(passport.session()); // passportのsessionを設定(中身はしらぬ)
// -- 追加ココまで --

var RedisModel = require('./model/redis');
// テンプレに渡す共通変数はここで定義する。
app.use(function (req, res, next) {
	// SUPER::render
	var _render = res.render;

	/* ユーザーがログイン済かどうか */
	var isAuthenticated = req.isAuthenticated();

	/* res.render をオーバーライド */
	res.render = function(view, options, fn) {
		/* 認証しているか否か */
		options.isAuthenticated = isAuthenticated;

		/* ユーザーデータを追加する */
		options.mydata = {};

		/* ログインしてなければユーザーデータを追加しない */
		if(!isAuthenticated) {
        	_render.call(this, view, options, fn);
			return;
		}

		/* ユーザーの投稿数 */
		knex.select(
			knex.raw('count(*) as impression_num')
		)
		.from('impression')
		.where('user_id', req.user)
		.then(function(rows) {
			options.mydata.impression_num = rows[0].impression_num;

			/* ユーザー名とユーザー画像 */
			return knex.select('displayname', 'thumbnail')
			.from('user')
			.where('id', req.user);
		})
		.then(function(rows) {
			options.mydata.profile = rows[0];

			/* ユーザーへ通知するメッセージを取得 */
			return RedisModel.get_user_notification(req.user);
		})
		.then(function(messages){
			options.user_messages = messages;

			/* 一度ユーザーへ通知したメッセージは削除する */
			return RedisModel.delete_user_notification(req.user);
		})
		.then(function(){
			// call SUPER::render
			_render.call(res, view, options, fn);
		})
		.catch(function(err) {
			throw err;
		});

    };
    next();
});

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
      isAuthenticated: false,
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
    isAuthenticated: false,
    message: err.message,
    error: {}
  });
});


module.exports = app;
