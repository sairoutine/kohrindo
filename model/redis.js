/*jslint node: true */
'use strict';

var redis = require('../lib/redis');
var util = require('util');
var Promise = require('bluebird');

var ModelBase = require('./base');

// コンストラクタ
var RedisModel = function() {
	ModelBase.apply(this,arguments);
};
// ModelBaseを継承
util.inherits(RedisModel, ModelBase);

/* ユーザーに通知するメッセージを登録 */
RedisModel.set_user_notification = function(user_id, message_type, message) {
	if (!user_id) throw new Error('no user_id is set.' + user_id);
	if (!message_type) throw new Error('no message_type is set.' + message_type);
	if (!message) throw new Error('no message is set.' + message);

	/* メッセージタイプ一覧 */
	var message_type_validation = {
		success: true,
		warning: true,
		info: true,
		danger: true,
	};

	if(!message_type_validation[message_type]) throw new Error('invalid message_type: ' + message_type);

	/* 保存する値 */
	var value = {
		type: message_type,
		value: message,
	};

	return redis.rpush('kohrindo:user_notification:' + user_id, JSON.stringify(value));
};

RedisModel.get_user_notification = function(user_id) {
	if (!user_id) throw new Error('no user_id is set.' + user_id);

	return redis.lrange('kohrindo:user_notification:' + user_id, 0, -1)
	.then(function(messages) {
		return new Promise(function(resolve, reject) {
			var parsed_messages = [];

			messages.forEach(function(message) {
				parsed_messages.push(JSON.parse(message));
			});

			resolve(parsed_messages);
		});
	});
};

RedisModel.delete_user_notification = function(user_id) {
	if (!user_id) throw new Error('no user_id is set.' + user_id);

	return redis.del('kohrindo:user_notification:' + user_id);
};

module.exports = RedisModel;
