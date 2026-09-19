#!/usr/bin/env bash
set -euo pipefail

# TASK 13 — Economic Backtest Report Runner (§20.1, §31)
# Executes walk-forward backtest evaluation with strict no-lookahead constraint.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export PYTHONPATH="${REPO_ROOT}/data-pipeline:${REPO_ROOT}/ml-service:${PYTHONPATH:-}"

python3 "${REPO_ROOT}/data-pipeline/backtesting/economic_backtest.py" "$@"

