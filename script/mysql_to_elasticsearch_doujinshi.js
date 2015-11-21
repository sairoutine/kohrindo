"use strict";
/*
 *
 * MySQL の同人誌情報を ElasticSearchに投入するスクリプト
 *
 */

var elastic = require('../model/elastic/doujinshi');
var knex = require('../lib/knex');
var Promise = require('bluebird');

Promise.resolve()
.then(function() {
	return knex.select('id', 'title', 'author', 'circle')
	.from('doujinshi');
})
.then(function(rows) {
	return rows.reduce(function(promise, row) {
		return promise.then(function() {
			return elastic.create(row)
			.catch(function(err) {
				console.log(err);
			});
		});
	}, Promise.resolve());
})
.then(function() {
	process.exit(0);
})
.catch(function(err) {
	console.log(err);
});
