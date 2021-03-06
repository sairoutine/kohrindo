'use strict';
/* TODO: cheerioは普通にPromise方式がある。 */
var client = require('cheerio-httpcli');
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');
var imagemagick = require('imagemagick-native');
var util = require('util');
var Promise = require('bluebird');

// external_doujin_info 用エラークラス
// コンストラクタ
var ExternalDoujinInfoError = function ExternalDoujinInfoError(message) {
	Error.call(this);
	this.message = message;
};
// 通常のErrorクラスを継承
util.inherits(ExternalDoujinInfoError, Error);


/* 東方創想話のURLかどうか調べる関数 */
module.exports.is_coolier_url = function(url) {
	return 0 < url.length && url.length < 255 && /^https?:\/\/coolier.dip.jp\/sosowa\/ssw_[lp]\/\d+\/\d+$/.test(url);
};

/* pixiv小説のURLかどうか調べる関数 */
module.exports.is_pixiv_url = function(url) {
	return true;
};

/* メロンブックスのURLかどうか調べる関数 */
module.exports.is_melonbooks_url = function(url) {
	return true;
};

module.exports.get_by_coolier = function(url, options) {
	options = options || {};
	return new Promise(function(resolve, reject) {
		client.fetch(url, options, function (err, $) {
			if(err) {
				return reject(err);
			}

			var data = {
				title:       '',
				author:      '',
				circle:      '',
				url:         url,
				thumbnail:   'doujin/coolier.png',
				cover_image: '',
			};
			// 著者
			data.author = $('meta[name=author]').attr('content').trim();
			// タイトル
			data.title  = $('h1').text().trim();

			resolve(data);
		});
	});
};
module.exports.get_by_pixiv = function(url, options) {
	options = options || {};
	return new Promise(function(resolve, reject) {
		client.fetch(url, options, function (err, $) {
			if(err) {
				return reject(err);
			}

			var data = {
				title:       '',
				author:      '',
				circle:      '',
				url:         url,
				thumbnail:   'doujin/pixiv.png',
				cover_image: '',
			};
			// タイトル
			data.title = $('h1.title').text().trim();
			// 著者
			data.author  = $('h2.name').text().trim();

			resolve(data);
		});
	});
};


module.exports.get_by_melonbooks = function(url, options) {
	options = options || {};
	return new Promise(function(resolve, reject) {
		client.fetch(url, options, function (err, $) {
			if(err) {
				return reject(err);
			}

			var data = {
				title:       '',
				author:      '',
				circle:      '',
				url:         url,
				thumbnail:   '',
				cover_image: '',
			};

			$('div#description table.stripe > tr').each(function () {
				var th = $(this).children('th').text().trim();
				var td = $(this).children('td').text().trim();
				if(th === 'タイトル') {
					data.title = td;
				}
				if(th === 'サークル名') {
					data.circle = td;
				}
				if(th === '作家名') {
					data.author = (td.split(/,/))[0].trim();
				}
			});

			// サムネイル画像
			var thumbnail_path = $('img[itemprop=image]').attr('src');

			// メロンブックスの画像IDと拡張子を取得
			var matches = thumbnail_path.match(/resize_image\.php\?image\=([0-9]+)(\.jpg|\.gif|\.png)/);

			// 画像保存用に画像IDからsha1値を計算
			var sha1string = crypto.pseudoRandomBytes(16).toString('hex');

			// 画像パス
			data.thumbnail = 'doujin/s_' + sha1string + matches[2];
			data.cover_image = 'doujin/' + sha1string + matches[2];

			// 画像を取得して保存
			request.get('https://www.melonbooks.co.jp/resize_image.php?width=150&height=150&image=' + matches[1] + matches[2])
			.on('error', function(err) {
				throw err;
			})
			.pipe(fs.createWriteStream('./public/img/' + data.thumbnail));

			// なぜか取得できん
			// 画像を取得して保存
			request.get('https://www.melonbooks.co.jp/resize_image.php?image=' + matches[0] + matches[1])
			.on('error', function(err) {
				throw err;
			})
			.pipe(fs.createWriteStream('./public/img/' + data.cover_image));
			resolve(data);
		});
	});
};

/* R18が取得できない */
module.exports.get_by_surugaya = function(url, options) {
	options = options || {};

	return new Promise(function(resolve, reject) {
		client.fetch(url, options, function (err, $) {
			if(err) {
				return reject(err);
			}

			var data = {
				title:       '',
				author:      '',
				circle:      '',
				url:         url,
				thumbnail:   '',
				cover_image: '',
			};

			// 表紙画像
			var cover_image_path = $('a#imagedetail').attr('href');

			// 画像保存用に画像IDからsha1値を計算
			var randam_string = crypto.pseudoRandomBytes(16).toString('hex');

			// 画像パス
			data.cover_image = 'doujin/' + randam_string + '.jpg';
			data.thumbnail = 'doujin/s_' + randam_string + '.jpg';

			// 表紙画像を取得して保存
			if(cover_image_path) {
				request.get(cover_image_path)
				.on('error', function(err) {
					return reject(err);
				})
				.on('end', function() {
					fs.writeFileSync('./public/img/' + data.thumbnail, imagemagick.convert({
						srcData: fs.readFileSync('./public/img/' + data.cover_image),
						width: 150,
						height: 150,
						resizeStyle: 'aspectfit',
					}));
				})
				.pipe(fs.createWriteStream('./public/img/' + data.cover_image));
			}
			else {
				return reject(new Error("Can't get cover image at " + url));
			}


			// タイトル
			var title = $('img#imagecaption').attr('alt');
			if( ! title) {
				return reject(new Error("Can't get title at " + url));
			}

			var matches = title.match(/(?:<<東方>>)?\s+(.+?)\s+\//);
			data.title = matches ? matches[1] : title;

			var tr_list = $('div#item_detailInfo table#datasheet > tr');
			for(var i = 0; i< tr_list.length; i++) {
				var tr = tr_list.eq(i).children();
				var name  = tr.eq(0).text().trim();
				var value = tr.eq(1).text().trim();

				if(name === '出版社') {
					data.circle = value;
				}
				if(name === '著' && !data.author) {
					data.author = value;
				}
			}

			resolve(data);
		});
	});
};

module.exports.get_list_by_surugaya = function(url, options) {
	options = options || {};

	return new Promise(function(resolve, reject) {
		client.fetch(url, options, function (err, $) {
			if(err) {
				return reject(err);
			}

			var urls = [];

			var tr_list = $('table.table1 > tr');
			for(var i = 0; i< tr_list.length; i++) {
				var tr = tr_list.eq(i).children();
				var href = tr.children('td > a').attr('href');

				if (typeof href !== 'undefined') {
					urls.push(href.toString().trim());
				}
			}

			resolve(urls);
		});
	});
};

