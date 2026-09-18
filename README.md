# Nara Baby

A baby tracking app for families: multiple caregivers log in and record
feedings and diaper changes for their baby (or babies), and everyone in the
family sees the same shared, real-time history.

- **`server/`** — Node/Express + SQLite REST API (auth, families, babies, feedings, diapers)
- **`mobile/`** — Expo (React Native) app that runs on iPhone and Android from one codebase

## How it works

- Whoever signs up first creates a **family** and gets a 6-character **invite code**.
- They share that code with other caregivers (partner, grandparent, nanny...),
  who enter it when creating their own account to join the same family.
- Everyone in a family sees the same babies, feedings and diaper changes, with
  each entry tagged with who logged it.

## Running the backend

```bash
cd server
npm install
npm start        # listens on http://localhost:4000
```

This creates a local `data.sqlite` file (ignored by git) the first time it runs.
Set `PORT` or `JWT_SECRET` env vars to override the defaults — in particular,
set a real `JWT_SECRET` before deploying anywhere beyond your own machine.

## Running the mobile app

```bash
cd mobile
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL if needed
npm start
```

Then:
- Press `i` to open in the iOS simulator (macOS only), or `a` for an Android
  emulator, or scan the QR code with the **Expo Go** app on your own iPhone/Android.
- If you're running on a physical device or an Android emulator, `localhost`
  won't reach your computer — set `EXPO_PUBLIC_API_URL` in `mobile/.env` to
  your computer's LAN IP instead (e.g. `http://192.168.1.23:4000/api`).

## Building real app-store binaries

This app has no custom native code, so it can also be built into a real `.ipa`/`.apk`
with [EAS Build](https://docs.expo.dev/build/introduction/) once you're ready to
ship it to the App Store / Play Store:

```bash
cd mobile
npx eas-cli build --platform ios
npx eas-cli build --platform android
```

## Project structure

```
server/
  src/
    db/            SQLite schema + connection
    middleware/     JWT auth, family/baby access checks
    routes/         auth, families, babies, feedings, diapers
mobile/
  src/
    api/            typed REST client
    context/        AuthContext (session, family, babies)
    navigation/      auth stack vs. main tabs
    screens/        Login, Register, Home (dashboard), Timeline, Family, Add Feeding/Diaper
    components/      shared UI (time-ago picker)
```
