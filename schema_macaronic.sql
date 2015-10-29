GRANT USAGE ON *.*  TO  'macaronic_admin'@'localhost';
DROP USER 'macaronic_admin'@'localhost';
CREATE USER 'macaronic_admin'@'localhost' IDENTIFIED BY '';

CREATE DATABASE IF NOT EXISTS macaronicdb;
GRANT ALL PRIVILEGES ON macaronicdb.* TO 'macaronic_admin'@'localhost';
FLUSH PRIVILEGES;

USE macaronicdb;

DROP TABLE IF EXISTS  macaronicUsers;

CREATE TABLE macaronicUsers(
   id integer primary key auto_increment,
   username varchar(100) unique,
   password varchar(100)
)engine=innodb charset utf8;

DROP TABLE IF EXISTS macaronicRecords;

CREATE TABLE macaronicRecords(
    id integer primary key auto_increment,
    username varchar(100) not null,
    rule text, 
    state_before text,
    state_after text,
    created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;

DROP TABLE IF EXISTS mturkUsers;

CREATE TABLE mturkUsers(
    id integer primary key auto_increment,
    username varchar(100) unique,
    progress integer not null default 0,
    points_earned integer not null default 0
)engine=innodb charset utf8;

DROP TABLE IF EXISTS mturkRecords;
CREATE TABLE mturkRecords(
    id integer primary key auto_increment,
    username varchar(100) not null,
    rule text, 
    state_before text,
    state_after text,
    created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;


