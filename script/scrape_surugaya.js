var doujin_info = require('../lib/external_doujin_info');

process.chdir('/home/kohrindo/kohrindo');

doujin_info.get_by_surugaya('http://www.suruga-ya.jp/product/detail/ZHORE9454')
.then(function(data) {
	console.log('タイトル:' + data.title);
	console.log('著者:' + data.author);
	console.log('サークル:' + data.circle);
	console.log('URL:' + data.url);
	console.log('サムネ' + data.thumbnail);
	console.log('カバー' + data.cover_image);
});

