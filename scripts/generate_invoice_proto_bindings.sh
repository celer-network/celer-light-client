#!/bin/sh
PROTOC_GEN_TS_PATH="node_modules/.bin/protoc-gen-ts"
OUT_DIR="src/protobufs"
protoc \
    -I${GOCELER}/merchantclient/proto \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}" \
    --ts_out="service=grpc-web:${OUT_DIR}" \
    ${GOCELER}/merchantclient/proto/invoice.proto
