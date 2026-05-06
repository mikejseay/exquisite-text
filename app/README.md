## Development & Deployment (Expo + EAS)

This project uses Expo (SDK 54+) and EAS for building and submitting native apps.

---

## Prerequisites

- Node.js >= 20
- An Expo account (https://expo.dev)

---

## Install Tooling

### Enable Corepack (recommended for Yarn 4 projects)

```bash
corepack enable
```

---

### Install Expo CLI

Use:

```bash
npm install -g expo
```

Or simply use via npx:

```bash
npx expo start
```

---

### Install Expo Application Services (EAS) CLI

```bash
npm install -g eas-cli
```

Verify installation:

```bash
eas --version
```

Login with Expo account credentials:

```bash
eas login
```

---

## Local Development

Make `app` your current directory and install the node dependencies:

```bash
cd app
yarn
```

### Server URL Configuration

The app connects to `https://www.exquisitetext.com` by default. To point it at a local server during development, create a `.env` file:

```bash
cp .env.example .env
```

This sets `EXPO_PUBLIC_WEBVIEW_URL`, the URL the WebView points at. For local dev on a **physical device** (e.g. an iPad scanning the QR code), use your computer's LAN IP rather than `localhost` — the device resolves `localhost` to itself, not your Mac:

```bash
EXPO_PUBLIC_WEBVIEW_URL=http://192.168.x.x:8080
```

Run `ipconfig getifaddr en0` (macOS Wi-Fi) to find your LAN IP. The `.env` file is gitignored, so it won't affect production builds, which always fall back to the production URL.

Start the development server (must be run from inside `app/` so it uses the local Expo CLI bundled with the project, not the deprecated global `expo-cli`):

```bash
cd app
npx expo start
```

Run on iOS simulator (only available on Mac OSX, also from inside `app/`):

```bash
npx expo run:ios
```

Run on Android emulator (requires Android SDK configuration, also from inside `app/`):

```bash
npx expo run:android
```

---

## Build with EAS

All production builds are created using EAS.

### iOS Build

```bash
eas build --platform ios
```

### Android Build

```bash
eas build --platform android
```

You can specify a profile if needed:

```bash
eas build --platform ios --profile production
```

---

## Submit to App Stores

### Submit iOS Build

```bash
eas submit --platform ios
```

### Submit Android Build

```bash
eas submit --platform android
```

---

## Fully npx-Based Alternative (No Global Installs)

If you prefer not to install EAS globally (run all commands from inside `app/`):

```bash
npx expo start
npx eas-cli build --platform ios
npx eas-cli submit --platform ios
```

---

## Versioning

Versioning is controlled via:

- `expo.version` (user-facing version)
- `ios.buildNumber` (iOS internal build number)
- `android.versionCode` (Android internal build number)

After updating versions, rebuild before submitting:

```bash
eas build --platform ios
eas submit --platform ios
```

---

## Troubleshooting

Clear Metro cache:

```bash
npx expo start --clear
```

Reset simulators (iOS):

```bash
xcrun simctl shutdown all
xcrun simctl erase all
```
