"use strict";
var elastic = require('../model/elastic/doujinshi');

var i = 9;

elastic.create({ id:i, title: '東方Project', author: 'ZUN', circle: '上海アリス' })
.then(function(){
	return elastic.update(i, { circle: '上海アリス幻樂団' });
})
.then(function(){
	return elastic.search_by_all('東方');
})
.then(function(result) {
	console.log('ヒット件数' + result.hits.total);
	result.hits.hits.forEach(function(res) {
		console.log(res._id);
	});
});
