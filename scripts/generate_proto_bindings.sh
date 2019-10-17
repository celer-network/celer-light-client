#!/bin/sh
PROTOC_GEN_TS_PATH="node_modules/.bin/protoc-gen-ts"
OUT_DIR="src/protobufs"
protoc \
    -I${PROTO} \
    -I${GOCELER}/webproxy/proto \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}" \
    --ts_out="service=grpc-web:${OUT_DIR}" \
    ${PROTO}/message.proto \
    ${PROTO}/entity.proto \
    ${PROTO}/chain.proto \
    ${GOCELER}/webproxy/proto/web_proxy.proto
