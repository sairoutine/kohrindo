/* TODO: cheerioは普通にPromise方式がある。 */
/* isURL 系のメソッドの中身を書く TODO */
var client = require('cheerio-httpcli');

var sha1sum = require('crypto').createHash('sha1');

/* 東方創想話のURLかどうか調べる関数 */
module.exports.is_coolier_url = function(url) {
	return true;
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
		client.fetch(url, options, function (err, $, res) {
			if(err) {
				reject(err);
				return;
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
		client.fetch(url, options, function (err, $, res) {
			if(err) {
				reject(err);
				return;
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
		client.fetch(url, options, function (err, $, res) {
			if(err) {
				reject(err);
				return;
			}

			var data = {
				title:       '',
				author:      '',
				circle:      '',
				url:         url,
				thumbnail:   '',
				cover_image: '',
			};

			// サムネイル画像
			thumbnail_path = $('img[itemprop=image]').attr('src');

			// メロンブックスの画像IDと拡張子を取得
			var matches = thumbnail_path.match(/resize_image\.php\?image\=([0-9]+)(\.jpg|\.gif|\.png)/);

			// 画像保存用に画像IDからsha1値を計算
			sha1sum.update(thumbnail_path);
			var sha1string = sha1sum.digest('hex');

			// 画像パス
			data.thumbnail = 'doujin/' + sha1string + matches[2];

			// 画像を取得して保存
			client.fetch('https://www.melonbooks.co.jp/resize_image.php?width=150&height=150&image=' + matches[0] + matches[1])
			.then(function (result) {
				if (result.error) {
					reject(result.error);
					return;
				}
				var fs = require('fs');
				fs.writeFile('public/img/' + data.thumbnail, result.body , function (err) {
					console.log(err);
					resolve(data);
				});
			});

			$('div#description table.stripe > tr').each(function (idx) {
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
			resolve(data);
		});
	});
};

//get_by_coolier('http://coolier.sytes.net:8080/sosowa/ssw_l/208/1446743023')
//get_by_pixiv('http://www.pixiv.net/novel/show.php?id=6007169')
/*
get_by_melonbooks('https://www.melonbooks.co.jp/detail/detail.php?product_id=142477')
.then(function(data) {
	console.log('タイトル:' + data.title);
	console.log('著者:' + data.author);
	console.log('サークル:' + data.circle);
	console.log('URL:' + data.url);
	console.log('サムネ' + data.thumbnail);
	console.log('カバー' + data.cover_image);
});
*/
