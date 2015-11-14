use doujinshi;
set character_set_database=utf8;
load data local infile "./bin/surugaya_doujinshi.csv" into table doujinshi fields terminated by ',';
