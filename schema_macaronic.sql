CREATE DATABASE IF NOT EXISTS macaronicdb;

USE macaronicdb;

DROP TABLE IF EXISTS mturkUsers;

CREATE TABLE mturkUsers(
    id integer primary key auto_increment,
    workerId varchar(255) unique,
    displayname varchar(255) not null,
    progress integer not null default 0,
    points_earned integer not null default 0
)engine=innodb charset utf8;

DROP TABLE IF EXISTS mturkRecords;
CREATE TABLE mturkRecords(
    id integer primary key auto_increment,
    workerId varchar(255) not null,
    displayname varchar(255) not null,
    rule text, 
    state_before text,
    state_after text,
    created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;


