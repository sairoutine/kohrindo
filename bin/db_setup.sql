DROP DATABASE IF EXISTS `doujinshi`;
CREATE DATABASE IF NOT EXISTS `doujinshi`;

use doujinshi;

CREATE TABLE `doujinshi` (
  `id`          int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `title`       varchar(255)     NOT NULL                COMMENT '本のタイトル',
  `author`      varchar(255)     NOT NULL                COMMENT '著者',
  `create_time` datetime         NOT NULL                COMMENT '作成日時',
  `update_time` datetime         NOT NULL                COMMENT '更新日時',
  `delete_time` datetime                  DEFAULT NULL   COMMENT '削除日時',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='本の一覧';

CREATE TABLE `impression` (
  `id`           int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `doujinshi_id` int(10) unsigned NOT NULL                COMMENT '同人誌ID',
  `article`      text             NOT NULL                COMMENT '感想',
  `create_time`  datetime         NOT NULL                COMMENT '作成日時',
  `update_time`  datetime         NOT NULL                COMMENT '更新日時',
  `delete_time`  datetime                  DEFAULT NULL   COMMENT '削除日時',
  PRIMARY KEY (`id`),
  KEY `i1` (`doujinshi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='感想の一覧';