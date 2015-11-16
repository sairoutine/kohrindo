# Development
### SETUP
```
git clone https://github.com/sairoutine/kohrindo.git
sudo npm install -g supervisor
# Redis Install
sudo rpm -Uvh http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
sudo rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
sudo yum --enablerepo=remi,remi-test install -y redis
sudo chkconfig --add redis
sudo chkconfig --level 345 redis on
sudo service redis start
# Mysql 5.6 Install
sudo yum -y install http://dev.mysql.com/get/mysql-community-release-el6-5.noarch.rpm
sudo yum -y install mysql-community-server
sudo chkconfig mysqld on
sudo service mysqld start
# Install node v1.2
fab root_install_node12 -H localhost
# Install ImageMagick
sudo yum install -y ImageMagick-c++ ImageMagick-c++-devel
# setup db
mysql -uroot < ./kohrindo/bin/db_setup.sql

vim ./start_kohrindo.sh
chmod 0700 ./start_kohrindo.sh
```

### start_kohrindo.sh
```
#!/bin/sh

# Twitter Auth Key
export TWITTER_CONSUMER_KEY=""
export TWITTER_CONSUMER_SECRET=""

# セッションのシークレットキー
export SESSION_SECRET=""

# 環境
export NODE_ENV="development"
#export NODE_ENV="production"

cd ./kohrindo
npm install
npm start
```

# Production

### mysql server setup on db01
```
sudo yum -y install http://dev.mysql.com/get/mysql-community-release-el6-5.noarch.rpm
sudo yum -y install mysql-community-server
sudo chkconfig mysqld on
git clone https://github.com/sairoutine/sai-chan.com-mysql.git
sudo cp sai-chan.com-mysql/my.cnf /etc/my.cnf
sudo service mysqld start
# 10.3.0.110 is ap001
echo 'grant all privileges on *.* to root@"10.3.0.110" with grant option;' | mysql -uroot
```

### redis server setup on db01
```
sudo rpm -Uvh http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
sudo rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
sudo yum --enablerepo=remi,remi-test install -y redis
sudo chkconfig --add redis
sudo chkconfig --level 345 redis on

# modify bind 127.0.0.1 -> bind db01
vim /etc/redis.conf

sudo service redis start
```

### app server setu on ap001
```
# node 0.12.2 Install
wget http://nodejs.org/dist/v0.12.2/node-v0.12.2-linux-x64.tar.gz
tar xvf node-v0.12.2-linux-x64.tar.gz
cp node-v0.12.2-linux-x64/bin/node /usr/local/bin/node
# npm Install
sudo yum install -y epel-release
sudo yum install -y npm --enablerepo=epel
# Install ImageMagick
sudo yum install -y gcc gcc-c++
sudo yum install -y ImageMagick-c++ ImageMagick-c++-devel
# Install forever
sudo npm install -g forever
# Add node user
sudo useradd node
su - node
# git clone apps
git clone https://github.com/sairoutine/kohrindo.git /home/node/kohrindo

# setup db
mysql -uroot < ./kohrindo/bin/db_setup.sql
mysql -uroot < ./kohrindo/bin/load_surugaya_csv.sql

vim ./start_kohrindo.sh
chmod 0700 ./start_kohrindo.sh
```






