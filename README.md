# Expo React Native YouTube Music Player

This folder contains the React Native Expo conversion of the current web app.

## Required Dependencies

Install these in a fresh Expo project:

```bash
npx create-expo-app youtube-music-native --template blank-typescript
cd youtube-music-native
npx expo install expo-linear-gradient react-native-webview @react-native-async-storage/async-storage
```

Then copy this folder's files into the Expo project:

```text
App.tsx
src/api/youtube.ts
src/services/db.ts
src/types.ts
```

## Run

```bash
npx expo start
```

## API Key Rotation

Open `src/api/youtube.ts` and add more Google API keys here:

```ts
export const API_KEYS = [
  'YOUR_FIRST_KEY',
  'YOUR_SECOND_KEY',
  'YOUR_THIRD_KEY',
];
```

If one key hits quota, the API layer automatically tries the next key. If all keys are exhausted, the UI shows: `Add more API key tokens`.

## Persistence

The Expo version uses `@react-native-async-storage/async-storage` for:

- Liked songs
- Created playlists
- Playlist songs

Data remains after app restart/refresh.

## Playback Note

YouTube does not provide direct audio streams through the Data API. This app uses a hidden `react-native-webview` YouTube IFrame player to control playback inside Expo.