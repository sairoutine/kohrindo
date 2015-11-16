'use strict';
var config = require('config');

/* DBへのコネクションをシングルトンに保つ */
var knex = require('knex')({
	client: 'mysql',
	connection: config.mysql,
	pool: config.mysqlpool
});
module.exports = knex;
