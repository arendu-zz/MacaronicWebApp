CREATE DATABASE IF NOT EXISTS macaronicdb;

USE macaronicdb;

DROP TABLE IF EXISTS mturkUsersAltInd;

CREATE TABLE mturkUsersAltInd(
    id integer primary key auto_increment,
    username varchar(255) unique,
    password varchar(255) not null,
    progress integer not null default 0,
    points_earned float not null default 0,
    confirmation_string varchar(255) unique
)engine=innodb charset utf8;
INSERT INTO mturkUsersAltInd (username, password, confirmation_string) VALUES ("GUEST", "GUEST", "GUEST");
DROP TABLE IF EXISTS mturkRecordsAltInd;
CREATE TABLE mturkRecordsAltInd(
    id integer primary key auto_increment,
    username varchar(255) not null,
    displayname varchar(255) not null,
    rule_type text,
    rule text,
    state_before text,
    visible_before text, 
    state_after text,
    visible_after text,
    created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;

DROP TABLE if exists mturkTranslationsAltInd;
CREATE TABLE mturkTranslationsAltInd(
  id integer primary key auto_increment,
  username varchar(255) not null,
  state text not null,
  input text not null,
  translation text not null,
  created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;


