CREATE DATABASE IF NOT EXISTS macaronicdb;

USE macaronicdb;

DROP TABLE IF EXISTS mturkUsers;

CREATE TABLE mturkUsers(
    id integer primary key auto_increment,
    username varchar(255) unique,
    progress integer not null default 0,
    points_earned float not null default 0,
    low_scores integer not null default 0
)engine=innodb charset utf8;

DROP TABLE IF EXISTS mturkUserCompletedSentences;
CREATE TABLE mturkUserCompletedSentences(
    id integer primary key auto_increment,
    username varchar(255) not null,
    sentence_id integer not null,
    points_earned integer,
    points_bonus integer,
    assignment_id text,
    hit_id text
)engine=innodb charset utf8;

DROP TABLE IF EXISTS mturkCompletedSentences;
CREATE TABLE mturkCompletedSentences(
    id integer primary key auto_increment,
    sentence_id integer not null,
    times_completed integer not null default 0
)engine=innodb charset utf8;

DROP  TABLE IF EXISTS  mturkGuesses;
CREATE TABLE mturkGuesses(
  id integer primary key auto_increment ,
  sentence_id integer not null,
  username varchar(255) not null,
  ui_version int not null,
  reveal_instantly boolean not null,
  show_reordering boolean not null,
  guesses_state text not null,
  sentence_state text not null,
  sentence_visible text,
  created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;

DROP TABLE IF EXISTS mturkRecords;
CREATE TABLE mturkRecords(
    id integer primary key auto_increment,
    sentence_id integer not null,
    username varchar(255) not null,
    ui_version int not null,
    rule_type text,
    rule text,
    state_before text,
    visible_before text,
    state_after text,
    visible_after text,
    created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;

DROP TABLE if exists mturkTranslations;
CREATE TABLE mturkTranslations(
  id integer primary key auto_increment,
  username varchar(255) not null,
  ui_version integer not null,
  sentence_id integer not null,
  state text,
  input text not null,
  translation text not null,
  created_at fieldtype not null default CURRENT_TIMESTAMP
)engine=innodb charset utf8;


