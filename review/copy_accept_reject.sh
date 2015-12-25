#!/bin/sh
set -e
scp -i "../aws_security/macaronicKeyPair.pem" ec2-user@52.91.100.69:~/MacaronicWebApp-Random/assignment.* .
