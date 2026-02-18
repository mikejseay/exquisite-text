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

Start the development server:

```bash
npx expo start
```

Run on iOS simulator (only available on Mac OSX):

```bash
npx expo run:ios
```

Run on Android emulator (requires Android SDK configuration):

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

If you prefer not to install EAS globally:

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
