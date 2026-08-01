#!/bin/bash
set -e

# Post-merge setup: install dependencies
npm install --prefer-offline 2>&1 | tail -5
echo "[post-merge] npm install complete"
