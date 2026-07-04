# Maestro E2E Tests

Maestro is a mobile UI testing framework. It is a CLI tool and is **not** an npm dependency.

## Installation

**macOS / Linux:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Windows:** Use WSL (run the curl command above inside WSL) or see the official docs at
https://maestro.mobile.dev/getting-started/installing-maestro for the Windows installer.

After installing, verify with:
```bash
maestro --version
```

## Running tests

### Set the App ID

`MAESTRO_APP_ID` is the bundle identifier for your build:
- **iOS Simulator:** check `app.json` → `expo.ios.bundleIdentifier`
- **Android Emulator:** check `app.json` → `expo.android.package`

Neither is set yet in `app.json` (Expo Go dev builds use `host.exp.exponent`); set one before
building a standalone dev client, then export it:

```bash
export MAESTRO_APP_ID=<your bundle id>
```

### Start the app on a running emulator/simulator, then:

```bash
# Run all flows
npm run test:e2e

# Dry-run (parse-only, no device required)
npm run test:e2e:dry
```

## Flow files

| File | Description |
|------|-------------|
| `smoke.yaml` | Launches the app and asserts the Login screen's "Driver Portal" text is visible |

## Adding new flows

Create `.yaml` files in this directory. Each flow:
1. Starts with `appId: ${MAESTRO_APP_ID}`
2. Followed by `---`
3. Then a list of Maestro commands

See the Maestro docs at https://maestro.mobile.dev/api-reference for available commands.
