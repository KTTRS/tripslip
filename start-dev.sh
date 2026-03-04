#!/bin/bash
npx turbo run dev &
sleep 3
node proxy-server.mjs
