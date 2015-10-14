#!/bin/sh
set -e
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 PASSWORD" >&2
    exit 1
fi
PASSWORD=$1
npm install
sed  "s/var config.*/var config = {host:'localhost', user:'macaronic_admin', password:'$PASSWORD', database:'macaronicdb'};/g" db_ref.js > db.js
MYSQLVER=$(mysql --help | grep Ver | head -1 | awk '{print $5}' | sed 's/,//g')
sed "s/IDENTIFIED BY.*/IDENTIFIED BY '$PASSWORD';/g" schema_macaronic.sql > tmp 
if [ "$MYSQLVER" = "5.5.3*" ]
then
    sed "s/created_at fieldtype/created_at timestamp/g" tmp > schema_macaronic.live.sql
elif [ "$MYSQLVER" = "5.5.4*" ]
then
    sed "s/created_at fieldtype/created_at timestamp/g" tmp > schema_macaronic.live.sql
else
    sed "s/created_at fieldtype/created_at datetime/g" tmp > schema_macaronic.live.sql
fi

