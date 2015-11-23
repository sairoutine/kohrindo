'use strict';
var doujin_info = require('../lib/external_doujin_info');
var Promise = require('bluebird');
var moment = require('moment');

process.chdir('/home/kohrindo/kohrindo');
var knex = require('../lib/knex');

// 商品リストのURL一覧
var list_urls = [];
for(var i=113;i>0;i--) {
	list_urls.push('http://www.suruga-ya.jp/search?category=&search_word=%E6%9D%B1%E6%96%B9+%E5%B0%8F%E8%AA%AC&adult_s=2&inStock=On&page=' + i + '&rankBy=release_date%28int%29%3Adescending&restrict[]=adult%20s(bool)=false');
}

// 個別の商品ページ一覧
var all_product_urls = [];

console.log('[BEGIN]個別の商品ページ一覧取得');

list_urls.reduce(function(promise, list_url) {
	return promise.then(function() {
		return doujin_info.get_list_by_surugaya(list_url)
		.then(function(product_urls){
			return new Promise(function(resolve, reject){
				Array.prototype.push.apply(all_product_urls, product_urls);
				resolve();
			});
		})
		.catch(function(err) {
			console.log(err);
		});
	});
}, Promise.resolve())
.then(function() {
	console.log('[ END ]個別の商品ページ一覧取得');

	// 商品個別ページのデータを取得してDBに保存する。
	var get_detail_promises = all_product_urls.reduce(function(promise, url) {
		return promise.then(function() {
			return doujin_info.get_by_surugaya(url)
			.then(function(data) {

				console.log('[DONE ]' + url);

				data.register_by = 'surugaya';

				var now = moment().format("YYYY-MM-DD HH:mm:ss");
				data.create_time = now;
				data.update_time = now;

				return knex('doujinshi').insert(data);
			})
			.catch(function(err) {
				console.log(err);
			});
		});
	}, Promise.resolve());

	return get_detail_promises;
})
.then(function (get_detail_promises) {
	// すべての商品個別ページの取得が完了
	console.log('done');
	knex.disconnect();
	process.exit();
})
.catch(function(err){
	console.log(err);
	process.exit();
});
