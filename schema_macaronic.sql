CREATE DATABASE IF NOT EXISTS macaronicdb;

USE macaronicdb;

DROP TABLE IF EXISTS mturkUsersInd;

CREATE TABLE mturkUsersInd(
    id integer primary key auto_increment,
    username varchar(255) unique,
    password varchar(255) not null,
    progress integer not null default 0,
    points_earned float not null default 0,
    confirmation_string varchar(255) unique
)engine=innodb charset utf8;
INSERT INTO mturkUsersInd (username, password, confirmation_string) VALUES ("GUEST", "GUEST", "GUEST");
DROP TABLE IF EXISTS mturkRecordsInd;
CREATE TABLE mturkRecordsInd(
    id integer primary key auto_increment,
    username varchar(255) not null,
    displayname varchar(255) not null,
    ui_version int not null,
    rule_type text,
    rule text,
    state_before text,
    visible_before text not null, 
    state_after text,
    visible_after text not null,
    created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;

DROP TABLE if exists mturkTranslationsInd;
CREATE TABLE mturkTranslationsInd(
  id integer primary key auto_increment,
  username varchar(255) not null,
  ui_version int not null,
  state text,
  input text not null,
  translation text not null,
  created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;


