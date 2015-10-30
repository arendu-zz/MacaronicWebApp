#!/bin/bash
set -e
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 PASSWORD (if running on www then use the password carl setup)" >&2
    exit 1
fi
PASSWORD=$1
npm install
sed  "s/var config.*/var config = {host:'localhost', user:'macaronic_admin', password:'$PASSWORD', database:'macaronicdb', charset:'utf8'};/g" db_ref.js > db.js
MYSQLVER=$(mysql --help | grep Ver | head -1 | awk '{print $5}' | sed 's/,//g')
sed "s/IDENTIFIED BY.*/IDENTIFIED BY '$PASSWORD';/g" schema_macaronic.sql > tmp 
case "$MYSQLVER" in
  5.5.3*)
    sed "s/created_at fieldtype/created_at timestamp/g" tmp > schema_macaronic.live.sql
	;;
  5.5.4*)
    sed "s/created_at fieldtype/created_at timestamp/g" tmp > schema_macaronic.live.sql
	;;
  *)
    sed "s/created_at fieldtype/created_at datetime/g" tmp > schema_macaronic.live.sql
	;;
esac
