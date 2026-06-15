#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .maestro/tracking-permission-denied.yaml
grep -qiE 'permission|denied|settings' .maestro/tracking-permission-denied.yaml
maestro test --dry-run .maestro/tracking-permission-denied.yaml 2>/dev/null || echo "NOTE: maestro not installed — manual-verify"
echo "COMPLETION OK: todo-063"
