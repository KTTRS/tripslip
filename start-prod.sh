#!/bin/bash
echo "Building TripSlip apps..."
for app in landing venue teacher parent school; do
  echo "Building $app..."
  cd /home/runner/workspace/apps/$app && npx vite build
  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build $app"
    exit 1
  fi
done
cd /home/runner/workspace
echo "All apps built. Starting production server..."
NODE_ENV=production node proxy-server.mjs
