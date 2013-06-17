#!/bin/sh
TIMESTAMP=$(date +"%m.%d.%Y at %H:%M:%S") 
while true;
do
	 NODE_ENV='prod' node/bin/node server.js >> logs/portal.log
         echo "-------------------------------Shutdown / Crash-------------------------------" >> logs/portal.log
	 echo "Server was reset on $TIMESTAMP" >> logs/crash.log
	 notify_by_pushover -u aJmPD4KigO0vLwim76n3WqWKwbKA3k -a YxspDLz3WinbPmwBThuZXCME9QmkDb  -s 'falling' -t "Portal Reset" -m "Biomed portal was reset on $TIMESTAMP . See the log file for more details"
done
