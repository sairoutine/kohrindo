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
# Install Java
sudo yum install -y java-1.8.0-openjdk
# Install ElasticSearch
sudo rpm --import https://packages.elastic.co/GPG-KEY-elasticsearch
vim /etc/yum.repos.d/elasticsearch.repo
sudo yum install elasticsearch
chkconfig --add elasticsearch
sudo service elasticsearch start
# Install Kuromoji
sudo yum install -y /usr/lib64/libssl3.so
/usr/share/elasticsearch/bin/plugin install analysis-kuromoji
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

### /etc/yum.repos.d/elasticsearch.repo
```
[elasticsearch-2.0]
name=Elasticsearch repository for 2.0 packages
baseurl=http://packages.elastic.co/elasticsearch/2.0/centos
gpgcheck=1
gpgkey=http://packages.elastic.co/GPG-KEY-elasticsearch
enabled=1
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

### elasticsearch setup on db01
```
# Install Java
sudo yum install -y java-1.8.0-openjdk
# Install ElasticSearch
sudo rpm --import https://packages.elastic.co/GPG-KEY-elasticsearch
vim /etc/yum.repos.d/elasticsearch.repo
sudo yum install -y elasticsearch
chkconfig --add elasticsearch
sudo service elasticsearch start
# Install Kuromoji
sudo yum install -y /usr/lib64/libssl3.so
/usr/share/elasticsearch/bin/plugin install analysis-kuromoji
```


### app server setup on ap001
```
# node 0.12.2 Install
fab root_install_node12 -H localhost
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

### integrating release
```
git pull --rebase
npm install
forever restartall
```





