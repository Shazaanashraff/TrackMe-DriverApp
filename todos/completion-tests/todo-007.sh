#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f .gitignore
grep -q 'node_modules' .gitignore
grep -q '.env' .gitignore
test -f .env.example
grep -q 'EXPO_PUBLIC_API_HOST' .env.example
grep -q 'API_URL' CLAUDE.md
! grep -q 'API_BASE_URL' CLAUDE.md
echo "COMPLETION OK: todo-007"
