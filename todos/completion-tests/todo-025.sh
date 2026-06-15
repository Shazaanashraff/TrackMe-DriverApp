#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for c in BusRegistrationForm RoutePicker; do
  ls src/features/bus-registration/$c.* >/dev/null 2>&1
done
S=$(ls src/screens/BusRegistrationScreen.* | head -1)
grep -q 'useRegisterBus' "$S"
! grep -Eq '(^|[^a-zA-Z])api\.|fetch\(' "$S"
test "$(wc -l < "$S")" -le 250
npx jest bus-registration
npm run typecheck
npm run lint
echo "COMPLETION OK: todo-025"
