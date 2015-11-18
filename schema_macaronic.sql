CREATE DATABASE IF NOT EXISTS macaronicdb;

USE macaronicdb;

DROP TABLE IF EXISTS mturkUsersAlt;

CREATE TABLE mturkUsersAlt(
    id integer primary key auto_increment,
    workerId varchar(255) unique,
    displayname varchar(255) not null,
    progress integer not null default 0,
    points_earned float not null default 0
)engine=innodb charset utf8;

DROP TABLE IF EXISTS mturkRecordsAlt;
CREATE TABLE mturkRecordsAlt(
    id integer primary key auto_increment,
    workerId varchar(255) not null,
    displayname varchar(255) not null,
    rule_type text,
    rule text,
    state_before text,
    visible_before text, 
    state_after text,
    visible_after text,
    created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;

DROP TABLE if exists mturkTranslationsAlt;
CREATE TABLE mturkTranslationsAlt(
  id integer primary key auto_increment,
  workerId varchar(255) not null,
  state text not null,
  input text not null,
  translation text not null,
  created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;


