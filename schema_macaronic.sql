CREATE USER 'macaronic_admin'@'localhost' IDENTIFIED BY 'macaronic_password';
create macaronicdb if not exists;
GRANT ALL PRIVILEGES ON macaronicdb.* TO 'macaronic_admin'@'localhost';
FLUSH PRIVILEGES;

use macaronicdb;

drop table if exists  macaronicUsers;

create table macaronicUsers(
   id integer primary key auto_increment,
   username varchar(100) unique,
   password varchar(100)
)engine=innodb charset utf8;

drop table if exists macaronicRecords;

create table macaronicRecords(
    id integer primary key auto_increment,
    username varchar(100) not null,
    rule text, 
    state_before text,
    state_after text,
    created_at datetime not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;
