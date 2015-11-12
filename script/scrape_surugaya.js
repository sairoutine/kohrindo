var doujin_info = require('../lib/external_doujin_info');

process.chdir('/home/kohrindo/kohrindo');

doujin_info.get_list_by_surugaya('http://www.suruga-ya.jp/search?category=&search_word=%E6%9D%B1%E6%96%B9+%E5%B0%8F%E8%AA%AC&adult_s=1&rankBy=release_date(int)%3Adescending')
.then(function (urls) {
	for(var i=0; i<urls.length; i++) {
		var url = urls[i];
		doujin_info.get_by_surugaya(url)
		.then(function(data) {
			console.log('タイトル:' + data.title);
			console.log('著者:' + data.author);
			console.log('サークル:' + data.circle);
			console.log('URL:' + data.url);
			console.log('サムネ' + data.thumbnail);
			console.log('カバー' + data.cover_image);
		})
		.catch(function(err){ console.log(err) });

	}
});

