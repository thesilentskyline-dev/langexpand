#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/projects"
cd "$PROJECT_DIR"

PORT="${DEPLOY_RUN_PORT:-5000}"

echo "Starting HTTP service on port ${PORT} for deploy..."
PORT=${PORT} exec node dist/server.js
