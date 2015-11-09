# SETUP
```
git clone https://github.com/sairoutine/kohrindo.git
sudo npm install -g supervisor
# Redis Install
sudo yum install -y redis
sudo chkconfig redis on
sudo service redis start
# Mysql 5.6 Install
sudo yum -y install http://dev.mysql.com/get/mysql-community-release-el6-5.noarch.rpm
sudo yum -y install mysql-community-server
sudo chkconfig mysqld on
sudo service mysqld start
# Install node v1.2
fab root_install_node12 -H localhost
# setup db
mysql -uroot < ./kohrindo/bin/db_setup.sql

vim ./start_kohrindo.sh
chmod 0700 ./start_kohrindo.sh
```

# start_kohrindo.sh
```
#!/bin/sh

# Twitter Auth Key
export TWITTER_CONSUMER_KEY=""
export TWITTER_CONSUMER_SECRET=""

cd ./kohrindo
npm install
npm start
```
