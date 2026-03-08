#!/bin/bash
set -e

cd /home/runner/workspace/apps/landing && npx vite build
cd /home/runner/workspace/apps/venue && npx vite build
cd /home/runner/workspace/apps/teacher && npx vite build
cd /home/runner/workspace/apps/parent && npx vite build
cd /home/runner/workspace/apps/school && npx vite build
