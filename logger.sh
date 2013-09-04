#!/bin/sh
while sleep 30; do
	TIMESTAMP=$(date +"%m.%d.%Y at %H:%M:%S")
	echo "$TIMESTAMP" >> logs/portal.log
done
