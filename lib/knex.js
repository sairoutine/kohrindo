/* DBへのコネクションをシングルトンに保つ */
var knex = require('knex')({
	client: 'mysql',
	connection: {
		host     : '127.0.0.1',
		user     : 'root',
		password : '',
		database : 'doujinshi'
	},
 	pool: {
		min: 1,
		max: 10
	}
});
module.exports = knex;
