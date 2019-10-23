#!/bin/sh
workDir=${PWD}
cd ${GOCELER}/test/manual
./setup.sh &
sleep 40
./run_server.sh &
sleep 1
./run_web_proxy.sh &
sleep 1
cd "$workDir"
jest
lsof -ti tcp:8545 | xargs kill
lsof -ti tcp:10000 | xargs kill
lsof -ti tcp:29980 | xargs kill
