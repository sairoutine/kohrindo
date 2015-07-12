var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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

// indexページ
var routes      = require('./routes/index');
app.use('/', routes);

// 同人誌一覧
var doujinshi   = require('./routes/doujinshi');
app.use('/doujinshi', doujinshi);

// 同人誌感想一覧・登録処理
var impression  = require('./routes/impression');
app.use('/impression', impression);

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
