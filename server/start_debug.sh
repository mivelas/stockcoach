#!/bin/bash
export NODE_OPTIONS='--loader ts-node/esm --no-warnings'
npx ts-node src/index.ts > debug.log 2>&1
