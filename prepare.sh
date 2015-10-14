#!/bin/sh
set -e
PASSWORD=$1
npm install
sed  "s/var config.*/var config ={host='localhost', user:'macaronic_admin', password:'$PASSWORD', database='macaronicdb'};/g" db_ref.js > db.js
MYSQLVER=$(mysql --help | grep Ver | head -1 | awk '{print $5}' | sed 's/,//g')
cp schema_macaronic.sql schema_macaronic.live.sql
if [ "$MYSQLVER" = "5.5.3*" ]
then
    sed "s/created_at fieldtype/created_at timestamp/g" schema_macaronic.sql > schema_macaronic.live.sql
elif [ "$MYSQLVER" = "5.5.4*" ]
then
    sed "s/created_at fieldtype/created_at timestamp/g" schema_macaronic.sql > schema_macaronic.live.sql
else
    sed "s/created_at fieldtype/created_at timestamp/g" schema_macaronic.sql > schema_macaronic.live.sql
fi

