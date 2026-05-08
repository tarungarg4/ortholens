# OrthoLens — Claude Code context

Expo SDK 54 React Native app. Orthopedic surgeons overlay X-ray images on a live camera feed.

## Run / build

```bash
npm install --legacy-peer-deps   # always use --legacy-peer-deps
npx expo start --clear           # --clear on first run or after dependency changes
eas build -p android --profile preview   # produces APK
```

## Critical conventions

**`index.ts` import order** — `import 'react-native-gesture-handler'` MUST be the very first line. Moving it breaks the TurboModule initialisation and causes a silent crash with a misleading "missing default export" error on every screen.

**expo-file-system** — import from `'expo-file-system/legacy'`, not `'expo-file-system'`. The newer default export uses a class-based API; the legacy import provides the `documentDirectory`, `copyAsync`, `deleteAsync` globals the codebase depends on.

**Reanimated v4** — `babel-preset-expo` must include `react-native-reanimated/plugin` in `babel.config.js`. Worklets require `react-native-worklets` (installed at `^0.5.1`).

**Peer dependencies** — always install with `--legacy-peer-deps`. The `.npmrc` file sets this as default. When adding a new Expo package use `npx expo install <pkg>` (not `npm install`) so the SDK-compatible version is resolved automatically; then run `npm install --legacy-peer-deps` to apply.

**Expo package versions** — `expo-sharing` and `expo-font` previously got installed at v55.x (SDK 55) instead of SDK 54 compatible versions (~14.x). SDK mismatches cause `NoSuchMethodError` crashes in the APK. Always use `expo install` to add Expo packages.

## Architecture notes

### Tab navigation (`app/index.tsx`)
All three tabs (Cases, Capture, Profile) are rendered simultaneously in a horizontal `Animated.View` strip (`width × 3`). Tab switches are local `withTiming(-idx * screenWidth)` calls — no navigation stack push. `useXrayLibrary` is lifted to the container and passed as props so the library state is shared.

### Overlay screen (`app/overlay.tsx`)
Two-step capture required because `captureRef` cannot capture the native `CameraView` layer:
1. `getSnapshot()` reads current pan/pinch/rotation from Reanimated shared values synchronously
2. `takePictureAsync()` freezes a real still photo
3. A capture-only `View` (ref: `captureViewRef`) mounts with `backgroundColor: '#000'`, frozen photo, and a **static** (non-animated) overlay at the snapshotted transforms
4. `onLoad` fires → 200 ms delay → `captureRef(captureViewRef)` → `addCapture(caseId, composite)` → navigate to `/annotate`

Adjustment pills (O/B/C) float `position:'absolute'` inside the scene view — they must not be normal-flow children or they push the camera view up. Vertical slider is also absolutely positioned.

### Annotation screen (`app/annotate.tsx`)
Strokes are stored as JSON vectors (`Stroke[]`) in AsyncStorage — JPEG flattening happens only at share time via `captureRef(canvasRef)` on the canvas-only view (image + SVG layer), excluding HUD and palette. The canvas view is the share target; the HUD holds Save and Share buttons.

### Gesture hook (`hooks/useOverlayGesture.ts`)
Returns `{ composedGesture, animatedStyle, reset, getSnapshot }`. `getSnapshot()` reads `.value` from each shared value on the JS thread — call this synchronously before any async operation in `handleCapture`. `reset()` uses `withSpring` for smooth snap-back and also resets `savedTX/TY/Scale/Rotation` to prevent stale gesture state.

### Storage (`hooks/useXrayLibrary.ts`)
Files stored at `documentDirectory/xrays/<id>.jpg`. Index in AsyncStorage under key `xray_library`. Hook exports: `addXRay`, `removeXRay`, `updateXRay`, `addCapture`, `updateCapture`, `clearAll`, `reload`.

`removeXRay` deletes both the original X-ray file and all capture files for the case. `addCapture` copies a composite from a temp URI into the xrays dir and appends it to `entry.captures`. `updateCapture` persists updated stroke vectors for an existing capture.

## Design system (`theme.ts`)
Deep navy palette. Key tokens:
- `colors.bg` `#05080f` — root background
- `colors.brand` / `colors.cyan300` `#4fc3f7` — primary accent
- `colors.surface1/2/3/4` — layered card backgrounds
- `colors.fg1–4` — text hierarchy
- `colors.success/warning/danger` — status colours
- `radii`, `space`, `fontSize`, `tracking` — standard spacing/type scale
