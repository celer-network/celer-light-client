#!/bin/sh
setupWaitTime=${1:-30} # TODO: Remove
workDir=${PWD}
testManualDir=${GOCELER}/test/manual
cd "$testManualDir"
./setup.sh &
sleep "$setupWaitTime"
cd ../../tools/osp-setup
go run osp_setup.go -profile /tmp/celer_manual_test/profile/o1_profile.json -ks ../../testing/env/keystore/osp1.json -ethpoolamt 10000 -blkdelay 0 -nopassword
cd "$testManualDir"
./run_osp.sh 1 &
sleep 1
./run_web_proxy.sh &
sleep 1
cd "$workDir"
jest
result=$?
geth=$(lsof -ti tcp:8545)
if [ -n "$geth" ]; then
    kill "$geth"
fi
osp=$(lsof -ti tcp:10000)
if [ -n "$osp" ]; then
    kill "$osp"
fi
proxy=$(lsof -ti tcp:29980)
if [ -n "$proxy" ]; then
    kill "$proxy"
fi
exit "$result"
