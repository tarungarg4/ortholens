# OrthoLens

A React Native mobile app for orthopedic surgeons to overlay X-ray images on a live camera feed — enabling real-time anatomical alignment during consultations, with capture, annotation, and case management.

## What it does

1. **Import** — Load an X-ray image from the photo library or photograph X-ray film with the camera.
2. **Overlay** — Project the X-ray as a semi-transparent layer over the live camera feed.
3. **Adjust** — Pan, pinch-to-zoom, and rotate the overlay with multi-touch gestures. Floating O/B/C pills control opacity, brightness, and contrast via a vertical slider. Flip horizontally for mirrored views. Reset returns everything to default with a spring animation.
4. **Capture** — Snap a composite photo (real patient view + X-ray overlay at current position/opacity). The image is saved to the case library and the annotation screen opens automatically.
5. **Annotate** — Draw on captures with pen, line, arrow, or text tools. Pick from three colors. Undo strokes. Annotations are stored as re-editable vectors. Share flattens the canvas to JPEG (HUD and palette are excluded from the image).
6. **Cases** — All imported X-rays are saved locally and organised in a case library. Long-press any case to open the Edit screen (label, notes, body region tags, invert toggle, capture history).

## Tech stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 54 (managed workflow) |
| Navigation | expo-router v4 (file-based stack) |
| Gestures | react-native-gesture-handler v2 |
| Animation | react-native-reanimated v4 |
| Camera | expo-camera (`CameraView`) |
| Screen capture | react-native-view-shot (`captureRef`) |
| Sharing | expo-sharing |
| Storage | AsyncStorage + expo-file-system (legacy) |
| Icons / reticle / annotation canvas | react-native-svg |

## Project structure

```
app/
  _layout.tsx        # Root stack navigator (GestureHandlerRootView)
  index.tsx          # Main screen — sliding tab container (Cases / Capture / Profile)
  overlay.tsx        # Full-screen camera + X-ray overlay with adjustment pills
  edit.tsx           # Case detail editor (label, notes, tags, invert, captures list)
  annotate.tsx       # Vector annotation screen (pen/line/arrow/text) + share

components/
  tabs/
    CasesTab.tsx     # Case library list (tap → overlay, long-press → edit)
    CaptureTab.tsx   # Import X-ray form
    ProfileTab.tsx   # Storage stats and data management
  AppHeader.tsx
  TabBar.tsx
  StatusPill.tsx
  IconButton.tsx

hooks/
  useXrayLibrary.ts    # CRUD for cases and captures (AsyncStorage + file system)
  useOverlayGesture.ts # Simultaneous pan/pinch/rotate gesture state

theme.ts             # Design tokens (colors, spacing, typography)
```

## Getting started

```bash
npm install --legacy-peer-deps
npx expo start --clear
```

Scan the QR code with Expo Go (iOS/Android) or run on a simulator.

## Building an APK

```bash
eas login
eas build -p android --profile preview
```

The `preview` profile in `eas.json` produces a standalone APK (no store upload required).

## Key design decisions

- **Capture flow**: `takePictureAsync` freezes a real photo, then `captureRef` screenshots the static composite — necessary because native camera layers can't be captured directly by view-shot. After capture the composite is saved to the case and the user is navigated to `/annotate`.
- **Gesture snapshot**: Before capture, pan/pinch/rotation values are read from Reanimated shared values synchronously and used to render a static overlay in the capture view, avoiding timing races.
- **Annotation re-editability**: Strokes are stored as JSON vectors (`Stroke[]`) in AsyncStorage. JPEG flattening only happens at share time via `captureRef` on the canvas-only view (image + SVG), excluding the HUD and palette.
- **Tab navigation**: All three tabs live in a single screen as a horizontal `Animated.View` strip. Tab switches are local `withTiming` animations — no navigation stack push/pop.
- **Storage**: X-ray files and capture composites are copied to `documentDirectory/xrays/` at save time. The library index (cases + captures + strokes) is stored in AsyncStorage. All data is on-device only.

## Permissions required

- **Camera** — live view and capture
- **Media library** — importing X-ray images from the photo library
