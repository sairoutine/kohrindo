"use strict";

var elastic = require('../..//lib/elasticsearch');

/*
var ModelBase = require('./base');

// コンストラクタ
var RedisModel = function() {
	ModelBase.apply(this,arguments);
};
// ModelBaseを継承
util.inherits(RedisModel, ModelBase);
*/

var index = 'doujinshi';

var type = 'doujinshi';

var ElasticSearchModel = function(){};

// create
ElasticSearchModel.create = function(data){
	return elastic.create({
		index: index,
		type: type,
		id: data.id,
		body: {
			title: data.title,
			author: data.author,
			circle: data.circle,
		}
	});
};

// update 
ElasticSearchModel.update = function(id, doc) {
	if(!id || !doc)  throw new Error('two arguments must be need'); 

	return elastic.update({
		index: index,
		type: type,
		id: id,
		body: {
			doc: doc,
		},
	});
};

// search
ElasticSearchModel.search = function(query, size, from) {
	size = size || 10;
	from = from || 0;

	return elastic.search({
		index: index,
		type: type,
		analyzer: 'kuromoji_analyzer',
		size: size,
		from: from, //paging offset
		body: {
			query: query,
		}	
	});
};

ElasticSearchModel.search_by_all = function(search_word, size, from) {
	size = size || 10;
	from = from || 0;
	
	var query =  {
		match: {
			_all: search_word,
		}
	};

	return this.search(query, size, from);
};

module.exports = ElasticSearchModel;
