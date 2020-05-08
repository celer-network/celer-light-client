#!/bin/sh
workDir=${PWD}
manualTestDir=${GOCELER}/test/manual
cd "$manualTestDir"
./setup.sh &
sleep 40
cd ../../tools/osp-setup
go run osp_setup.go -profile /tmp/celer_manual_test/profile/o1_profile.json -ks ../../testing/env/keystore/osp1.json -ethpoolamt 10000 -blkdelay 0 -nopassword
cd "$manualTestDir"
./run_osp.sh 1 &
sleep 1
./run_web_proxy.sh &
sleep 1
cd "$workDir"
jest
lsof -ti tcp:8545 | xargs kill
lsof -ti tcp:10000 | xargs kill
lsof -ti tcp:29980 | xargs kill
