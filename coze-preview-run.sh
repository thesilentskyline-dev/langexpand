#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/projects"
cd "$PROJECT_DIR"

export PORT=5000
export COZE_WORKSPACE_PATH="$PROJECT_DIR"

exec bash ./scripts/dev.sh
