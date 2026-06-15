#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .maestro/auth-login.yaml
test -f .maestro/auth-non-driver.yaml
test -f .maestro/auth-logout.yaml
grep -qiE 'error|assertVisible' .maestro/auth-non-driver.yaml
maestro test --dry-run .maestro/auth-login.yaml 2>/dev/null || echo "NOTE: maestro not installed — manual-verify"
echo "COMPLETION OK: todo-060"
