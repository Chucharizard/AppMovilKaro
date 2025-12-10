Expo Maps setup (quick guide)

1) Install packages

Run in project root:

```powershell
npx expo install expo-maps
npx expo install expo-location
```

2) app.json

We updated `app.json` with your Google Maps API key under `expo.android.config.googleMaps.apiKey`. If you use `app.config.js`, add the same value in the `android.config.googleMaps.apiKey` and `ios.config.googleMapsApiKey` fields.

3) Development notes

- On Android, `expo-maps` works in Expo Go (SDK 48+). If you get blank map tiles, ensure your Google Maps API key is enabled for `Maps SDK for Android` and billing is active. Also add package+SHA-1 restriction later for security.

- On iOS, to use Google Maps you need a development build or EAS build. Expo Go on iOS uses Apple Maps.

4) Example usage

We added `src/components/ExpoMap.js` and `src/screens/ExpoMapScreen.js` as a ready-to-use component and an example screen.

5) How to run the map screen

- Start Metro dev server: `npx expo start --dev-client` (or `npx expo start`)
- Run on Android (Expo Go may work): `npx expo run:android`
- Open the `ExpoMapScreen` from your app navigation or temporarily import it into an existing screen to test.

6) Troubleshooting

- If tiles are blank: check device internet; check `Maps SDK for Android` enabled in GCP; try removing API key restrictions temporarily; check logs with `adb logcat` for `Google Maps` errors.

7) Next steps

- If you want, I can wire `ExpoMapScreen` into your app navigation (add a tab or route) so it's accessible from the UI.
