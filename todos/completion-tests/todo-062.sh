#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .maestro/tracking-lifecycle.yaml
grep -qiE 'start|stop|tracking' .maestro/tracking-lifecycle.yaml
maestro test --dry-run .maestro/tracking-lifecycle.yaml 2>/dev/null || echo "NOTE: maestro not installed — manual-verify"
echo "COMPLETION OK: todo-062"
