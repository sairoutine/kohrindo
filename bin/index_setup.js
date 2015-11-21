#!/usr/local/bin/node
"use strict";

var Promise = require('bluebird');
var elasticsearch = require('./lib/elasticsearch');

/*
Promise.resolve()
.then(function() {
	// インデックスを全て削除
	return elasticsearch.indices.delete({
		"index": "doujinshi",
	});
})
.then(function() {
	// インデックスの作成
	return elasticsearch.indices.create({
		"index": "doujinshi",
	});
});
*/
/* 型
string
number
date
boolean
binary
*/

/* index
analyzed: インデックスに登録される。解析される。
no: インデックスに登録されない。解析されない。
not_analyzed: インデックスに登録される。解析されない(完全一致でのみ検索可能)
*/

Promise.resolve()
.then(function() {
	// インデックスを一旦クローズ
	return elasticsearch.indices.close({
		"index": "doujinshi",
	});
})
.then(function() {
	// インデックスのデフォルトのセッティング
	return elasticsearch.indices.putSettings({
		"index": "doujinshi",
		"body": {
			"analysis": {
				filter: {
					pos_filter: {type: "kuromoji_part_of_speech", stoptags: ["助詞-格助詞-一般", "助詞-終助詞"]},
					greek_lowercase_filter: {type: "lowercase", language: "greek"}
				},
				analyzer: {
					kuromoji_analyzer: {
						type: "custom",
						tokenizer: "kuromoji_tokenizer",
						/*
						 * kuromoji_baseform: 動詞と形容詞を原型に戻す
						 * pos_filter: 除外する品詞
						 * greek_lowercase_filter: 英字を小文字に統一
						 * 全角英数字を半角、半角カタカナを全角に
						 */
						filter: ["kuromoji_baseform", "pos_filter", "greek_lowercase_filter", "cjk_width"]
					}
				}
			}
		}
	});
})

.then(function(){
	// 同人誌情報
	return elasticsearch.indices.putMapping({
		"index": "doujinshi",
		"type":  "doujinshi",
		//"_id": "mysql.doujinshi.id", //ドキュメント固有のID。MySQLにauto incrementの準拠
		"dynamic": "strict",
		"body": {
			// 元データは不要だがupdateに必要なので
			_source: {enabled: true},
			// データ全体で検索できるようにしておく
			_all: {enabled: true, analyzer: "kuromoji_analyzer"},
			"properties": {
				"title": {
					"type": "string",
					"index": "analyzed",
					"analyzer": "kuromoji_analyzer",
					"store": "yes",
					"boost": 1, // どれくらい重要なフィールドか
					"include_in_all": true,
				},
				"author": {
					"type": "string",
					"index": "analyzed",
					"analyzer": "kuromoji_analyzer",
					"store": "yes",
					"boost": 1, // どれくらい重要なフィールドか
					"include_in_all": true,
				},
				"circle": {
					"type": "string",
					"index": "analyzed",
					"analyzer": "kuromoji_analyzer",
					"store": "yes",
					"boost": 1, // どれくらい重要なフィールドか
					"include_in_all": true,
				},
			},
		}
	});
})
.then(function(){
	// 感想情報
	return elasticsearch.indices.putMapping({
		"index": "doujinshi",
		"type":  "impression",
		"dynamic": "strict",
		"body": {
			_source: {enabled: true},
			_all: {enabled: true, analyzer: "kuromoji_analyzer"},
			"properties": {
				"title": {
					"type": "string",
					"index": "analyzed",
					"analyzer": "kuromoji_analyzer",
					"store": "yes",
					"boost": 1,
					"include_in_all": true,
				},
				"author": {
					"type": "string",
					"index": "analyzed",
					"analyzer": "kuromoji_analyzer",
					"store": "yes",
					"boost": 1,
					"include_in_all": true,
				},
				"circle": {
					"type": "string",
					"index": "analyzed",
					"analyzer": "kuromoji_analyzer",
					"store": "yes",
					"boost": 1,
					"include_in_all": true,
				},
				"body": {
					"type": "string",
					"index": "analyzed",
					"analyzer": "kuromoji_analyzer",
					"store": "yes",
					"boost": 3,
					"include_in_all": true,
				},
			},
		}
	});
})
.then(function() {
	// インデックスをオープン
	return elasticsearch.indices.open({
		"index": "doujinshi",
	});
});
