# OpenBMTC

OpenBMTC is a React Native (Expo) app for exploring BMTC bus routes and stops in Bengaluru (Bangalore). It focuses on fast search, nearby stops, and clear route details with a clean, mobile-first experience.

## Features

- Search bus stops and routes with fast suggestions
- View route details and stop sequences in a dedicated modal
- See nearby stops using your current location and a distance slider
- Open a live transit map via an embedded web view
- API health and dataset status on the home screen
- Offline-friendly caching for stops and route endpoints

## App Navigation

- `/(tabs)` Home dashboard and quick actions
- `/search-routes` Unified search for stops and routes
- `/nearest-stops` Nearby stops with location permission flow
- `/stop-details` Stop details and route summaries
- `/maps` Embedded transit map
- `/onboarding` First-run onboarding and location permission prompt

## Data and API

The mobile app uses a hosted API by default (this repository does not include API routes).

- Base URL: `https://open-bmtc-api.vercel.app/api`
- Endpoints used in the app:
  - `/bmtc/stops` for the full stop list
  - `/bmtc/aggregated?routeId=...` for route details and route search
  - `/health` and `/meta` for service status

Stops and route endpoints are cached in `AsyncStorage` for 24 hours to reduce network calls and improve startup speed.

If you want to use your own backend, update `API_BASE_URL` in `utils/api.ts`.

Maps by: `https://transitrouter.pages.dev/`.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- Expo Router
- TypeScript
- NativeWind (Tailwind-style utilities)
- AsyncStorage for on-device caching

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Expo CLI

### Install

```bash
npm install
```

### Run

```bash
npx expo start
```

or

```bash
npm run start
```

Then open the project in Expo Go, an Android emulator, or the iOS simulator.

### Build (Android)

```bash
eas build -p android --profile production
```

## Configuration

Location permissions are configured in `app.json` for Android and iOS. If you customize permissions or add new native modules, re-run the Expo prebuild or rebuild your native app.

## Project Structure

```
app/                Expo Router screens
components/         Reusable UI components
lib/                MongoDB helpers (optional server use)
services/           Backend service functions (optional)
utils/              Client API helpers and caching
types/              Shared TypeScript types
assets/             App icons and images
```

## Optional MongoDB Integration

The repository includes MongoDB helpers and service functions that can be used if you add API routes or a separate backend. See `docs/MONGODB_INTEGRATION.md` for a walkthrough.

## Useful Links

- Expo Go app (Android): `https://play.google.com/store/apps/details?id=host.exp.exponent&hl=en_IN`
- Expo documentation: `https://docs.expo.dev/`

## Contributing

Issues and pull requests are welcome. If you plan a larger change, open an issue first to align on the scope.

## License

See `LICENSE`.
