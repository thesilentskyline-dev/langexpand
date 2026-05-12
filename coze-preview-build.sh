#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/projects"

echo "Installing dependencies in ${PROJECT_DIR}..."
cd "$PROJECT_DIR"
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel error --reporter=append-only
