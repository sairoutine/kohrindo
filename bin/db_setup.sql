DROP DATABASE IF EXISTS `doujinshi`;
CREATE DATABASE IF NOT EXISTS `doujinshi`;

use doujinshi;

CREATE TABLE `doujinshi` (
  `id`          int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `title`       varchar(255)     NOT NULL                COMMENT '本のタイトル',
  `author`      varchar(255)     NOT NULL                COMMENT '著者',
  `circle`      varchar(255)              DEFAULT NULL   COMMENT 'サークル名',
  `url`         varchar(255)              DEFAULT NULL   COMMENT '詳細URL',
  `thumbnail`   varchar(255)              DEFAULT NULL   COMMENT '表紙画像のサムネイルパス',
  `cover_image` varchar(255)              DEFAULT NULL   COMMENT '表紙画像のパス',
  `create_time` datetime         NOT NULL                COMMENT '作成日時',
  `update_time` datetime         NOT NULL                COMMENT '更新日時',
  `delete_time` datetime                  DEFAULT NULL   COMMENT '削除日時',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='本の一覧';

CREATE TABLE `impression` (
  `id`           int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `doujinshi_id` int(10) unsigned NOT NULL                COMMENT '同人誌ID',
  `body`         text             NOT NULL                COMMENT '感想',
  `create_time`  datetime         NOT NULL                COMMENT '作成日時',
  `update_time`  datetime         NOT NULL                COMMENT '更新日時',
  `delete_time`  datetime                  DEFAULT NULL   COMMENT '削除日時',
  PRIMARY KEY (`id`),
  KEY `i1` (`doujinshi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='感想の一覧';


CREATE TABLE `user` (
  `id`           int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID(このサービス上の内部で使う)',
  -- `username`     varchar(255)                             COMMENT 'ユーザーネーム(ログイン等で使う)',
  `displayname`  varchar(255)     NOT NULL                COMMENT 'ニックネーム',
  `thumbnail`    varchar(255)              DEFAULT NULL   COMMENT '画像パス',
  `url`          varchar(255)              DEFAULT NULL   COMMENT 'URLパス',
  `introduction` varchar(255)              DEFAULT NULL   COMMENT '自己紹介',
  `create_time`  datetime         NOT NULL                COMMENT '作成日時',
  `update_time`  datetime         NOT NULL                COMMENT '更新日時',
  `delete_time`  datetime                  DEFAULT NULL   COMMENT '削除日時',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='ユーザー管理テーブル';


CREATE TABLE `user_twitter` (
  `id`              int(10) unsigned NOT NULL                COMMENT 'ID(user.idの外部キー)',
  `twitter_id`      int(10) unsigned NOT NULL                COMMENT 'ID(Twitter内部で使われてる)',
  `consumer_key`    varchar(255)     NOT NULL                COMMENT 'consumer_key',
  `consumer_secret` varchar(255)     NOT NULL                COMMENT 'consumer_secret_key',
  `create_time`     datetime         NOT NULL                COMMENT '作成日時',
  `update_time`     datetime         NOT NULL                COMMENT '更新日時',
  `delete_time`     datetime                  DEFAULT NULL   COMMENT '削除日時',
  PRIMARY KEY (`id`),
  -- UNIQUE にする
  KEY `i1` (`twitter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Twitterで認証したユーザー';
