import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Line } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useOverlayGesture } from '../hooks/useOverlayGesture';
import { useXrayLibrary } from '../hooks/useXrayLibrary';
import { colors, radii, fontSize, tracking, space } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');

type AdjustPill = 'opacity' | 'brightness' | 'contrast';

const PILL_LABELS: Record<AdjustPill, string> = {
  opacity: 'Opacity',
  brightness: 'Brightness',
  contrast: 'Contrast',
};

function IconBack() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.fg1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}
function IconReset() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.fg2} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.4 8.4 0 11-2.5-6" /><Path d="M21 4v6h-6" />
    </Svg>
  );
}
function IconFlip() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 3v18" />
    </Svg>
  );
}
function IconInvert() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3z" />
      <Path d="M12 3v18" />
      <Path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export default function OverlayScreen() {
  const router = useRouter();
  const { id: caseId, uri, label, inverted: invertedParam } = useLocalSearchParams<{ id: string; uri: string; label: string; inverted?: string }>();
  const { addCapture } = useXrayLibrary();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [opacity, setOpacity] = useState(0.65);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [activePill, setActivePill] = useState<AdjustPill | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [imageInverted, setImageInverted] = useState(invertedParam === 'true');

  const cameraRef = useRef<CameraView>(null);
  const [frozenPhoto, setFrozenPhoto] = useState<string | null>(null);
  const captureViewRef = useRef<View>(null);
  const [captureState, setCaptureState] = useState<{
    translateX: number; translateY: number; scale: number; rotation: number;
  } | null>(null);
  const { composedGesture, animatedStyle, reset: resetGesture, getSnapshot } = useOverlayGesture();

  function togglePill(pill: AdjustPill) {
    setActivePill(p => p === pill ? null : pill);
  }

  function handleReset() {
    resetGesture();
    setOpacity(0.65);
    setBrightness(1);
    setContrast(1);
    setFlipped(false);
    setImageInverted(invertedParam === 'true');
    setActivePill(null);
  }

  const pillValue = (pill: AdjustPill) => {
    if (pill === 'opacity') return `${Math.round(opacity * 100)}%`;
    if (pill === 'brightness') return `${brightness.toFixed(1)}×`;
    return `${contrast.toFixed(1)}×`;
  };

  const sliderProps = activePill === 'opacity'
    ? { min: 0, max: 1, value: opacity, onChange: setOpacity }
    : activePill === 'brightness'
    ? { min: 0.25, max: 2.5, value: brightness, onChange: setBrightness }
    : { min: 0.25, max: 2.5, value: contrast, onChange: setContrast };

  const imageFilter = [
    ...(imageInverted ? [{ invert: 1 }] : []),
    { brightness },
    { contrast },
  ] as any;

  if (!cameraPermission) return <View style={styles.bg} />;

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>OrthoLens needs camera access to overlay X-ray images on the patient's body.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestCameraPermission}>
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleCapture() {
    try {
      const snapshot = getSnapshot();
      const photo = await cameraRef.current!.takePictureAsync({ quality: 0.95, skipProcessing: true });
      setCaptureState(snapshot);
      setFrozenPhoto(photo!.uri);
    } catch (e: any) {
      Alert.alert('Capture Failed', e?.message ?? 'Could not take photo.');
    }
  }

  async function onCapturePhotoLoad() {
    await new Promise<void>(resolve => setTimeout(resolve, 200));
    try {
      const composite = await captureRef(captureViewRef, { format: 'jpg', quality: 0.95 });
      const capture = await addCapture(caseId, composite);
      setFrozenPhoto(null);
      setCaptureState(null);
      router.push({ pathname: '/annotate', params: { caseId, captureId: capture.id } });
    } catch (e: any) {
      setFrozenPhoto(null);
      setCaptureState(null);
      Alert.alert('Capture Failed', e?.message ?? 'Could not save image.');
    }
  }

  return (
    <View style={styles.bg}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Camera + overlay scene — fills all space above the dock */}
      <View style={styles.scene}>
        {!frozenPhoto && (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        )}

        {/* Live overlay: reticle + gesture X-ray */}
        <View style={StyleSheet.absoluteFill}>
          <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${SW} ${SH * 0.78}`} preserveAspectRatio="none">
            <Line x1={0} y1={SH * 0.39} x2={SW} y2={SH * 0.39} stroke={colors.cyan300} strokeWidth={0.5} opacity={0.25} />
            <Line x1={SW / 2} y1={0} x2={SW / 2} y2={SH * 0.78} stroke={colors.cyan300} strokeWidth={0.5} opacity={0.25} />
            {[
              `M ${SW*0.18} ${SH*0.28} L ${SW*0.18} ${SH*0.32} M ${SW*0.18} ${SH*0.28} L ${SW*0.24} ${SH*0.28}`,
              `M ${SW*0.82} ${SH*0.28} L ${SW*0.82} ${SH*0.32} M ${SW*0.82} ${SH*0.28} L ${SW*0.76} ${SH*0.28}`,
              `M ${SW*0.18} ${SH*0.50} L ${SW*0.18} ${SH*0.54} M ${SW*0.18} ${SH*0.54} L ${SW*0.24} ${SH*0.54}`,
              `M ${SW*0.82} ${SH*0.50} L ${SW*0.82} ${SH*0.54} M ${SW*0.82} ${SH*0.54} L ${SW*0.76} ${SH*0.54}`,
            ].map((d, i) => (
              <Path key={i} d={d} stroke={colors.success} strokeWidth={2} fill="none" opacity={0.85} strokeLinecap="round" />
            ))}
          </Svg>

          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.overlay, animatedStyle]}>
              <Animated.Image
                source={{ uri }}
                style={[styles.overlayImage, { opacity }, flipped && { transform: [{ scaleX: -1 }] }, ({ filter: imageFilter } as any)]}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Frozen capture composite */}
        {frozenPhoto && captureState && (
          <View
            ref={captureViewRef}
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}
            collapsable={false}
            pointerEvents="none"
          >
            <Image
              source={{ uri: frozenPhoto }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onLoad={onCapturePhotoLoad}
            />
            <View
              style={[styles.overlay, {
                transform: [
                  { translateX: captureState.translateX },
                  { translateY: captureState.translateY },
                  { scale: captureState.scale },
                  { rotate: `${captureState.rotation}rad` },
                ],
              }]}
            >
              <Image
                source={{ uri }}
                style={[styles.overlayImage, { opacity }, flipped && { transform: [{ scaleX: -1 }] }, ({ filter: imageFilter } as any)]}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* Top HUD */}
        <View style={styles.topHud}>
          <TouchableOpacity style={styles.hudIconBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <IconBack />
          </TouchableOpacity>
          <View style={styles.hudMeta}>
            <Text style={styles.hudCase} numberOfLines={1}>{label}</Text>
            <View style={styles.hudStatusRow}>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: frozenPhoto ? colors.warning : colors.success }]} />
                <Text style={[styles.statusText, { color: frozenPhoto ? colors.warning : colors.success }]}>
                  {frozenPhoto ? 'Processing…' : 'Overlay locked'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.hudIconBtn} onPress={handleReset} activeOpacity={0.7}>
            <IconReset />
          </TouchableOpacity>
        </View>

        {/* Vertical slider — floats over scene on right when a pill is active */}
        {activePill && (
          <View style={styles.vertPanel} pointerEvents="box-none">
            <Text style={styles.vertPanelLabel}>{PILL_LABELS[activePill]}</Text>
            <View style={styles.vertSliderWrap}>
              <Slider
                style={styles.vertSlider}
                minimumValue={sliderProps.min}
                maximumValue={sliderProps.max}
                value={sliderProps.value}
                onValueChange={sliderProps.onChange}
                minimumTrackTintColor={colors.cyan300}
                maximumTrackTintColor="rgba(255,255,255,0.18)"
                thumbTintColor={colors.cyan300}
              />
            </View>
            <Text style={styles.vertPanelValue}>{pillValue(activePill)}</Text>
          </View>
        )}

        {/* O / B / C pills — float at bottom of scene */}
        <View style={styles.pillsOverlay} pointerEvents="box-none">
          {(['opacity', 'brightness', 'contrast'] as AdjustPill[]).map(pill => {
            const active = activePill === pill;
            return (
              <TouchableOpacity
                key={pill}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => togglePill(pill)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillName, active && styles.pillTextActive]}>
                  {pill[0].toUpperCase()}
                </Text>
                <Text style={[styles.pillVal, active && styles.pillTextActive]}>
                  {pillValue(pill)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom dock: Flip | ◉ Capture | Invert */}
      <View style={styles.bottomDock}>
        <TouchableOpacity
          style={[styles.dockBtn, flipped && styles.dockBtnActive]}
          onPress={() => setFlipped(f => !f)}
          activeOpacity={0.7}
        >
          <IconFlip />
          <Text style={[styles.dockBtnLabel, flipped && { color: colors.cyan300 }]}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.85} disabled={!!frozenPhoto}>
          <View style={[styles.captureBtnInner, frozenPhoto && { backgroundColor: colors.warning }]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dockBtn, imageInverted && styles.dockBtnActive]}
          onPress={() => setImageInverted(v => !v)}
          activeOpacity={0.7}
        >
          <IconInvert />
          <Text style={[styles.dockBtnLabel, imageInverted && { color: colors.cyan300 }]}>Invert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  scene: { flex: 1, overflow: 'hidden' },
  overlay: {
    position: 'absolute',
    width: SW,
    height: SH * 0.7,
    top: SH * 0.04,
    left: 0,
  },
  overlayImage: { width: '100%', height: '100%' },

  topHud: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: 'rgba(5,8,15,0.75)',
  },
  hudIconBtn: {
    width: 40, height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  hudMeta: { flex: 1, gap: 4 },
  hudCase: {
    fontSize: fontSize.xs,
    letterSpacing: tracking.caps,
    textTransform: 'uppercase',
    color: colors.cyan300,
    fontWeight: '500',
  },
  hudStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '500' },

  // Vertical slider panel — floats on right side of scene
  vertPanel: {
    position: 'absolute',
    right: 14,
    top: '28%',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(5,8,15,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  vertPanelLabel: {
    fontSize: 9,
    color: colors.cyan300,
    fontWeight: '700',
    letterSpacing: tracking.caps,
    textTransform: 'uppercase',
  },
  vertSliderWrap: {
    height: 150,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertSlider: {
    width: 150,
    height: 40,
    transform: [{ rotate: '-90deg' }],
  },
  vertPanelValue: {
    fontSize: 11,
    color: colors.cyan200,
    fontWeight: '600',
  },

  // Pills floating at bottom of scene
  pillsOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
  },
  pill: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(5,8,15,0.52)',
  },
  pillActive: {
    borderColor: colors.cyan300,
    backgroundColor: 'rgba(79,195,247,0.18)',
  },
  pillName: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: tracking.caps,
    color: colors.fg3,
    textTransform: 'uppercase',
  },
  pillVal: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.fg3,
  },
  pillTextActive: { color: colors.cyan300 },

  bottomDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: 'rgba(5,8,15,0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.border1,
  },
  dockBtn: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radii.md,
    minWidth: 64,
  },
  dockBtnActive: { backgroundColor: 'rgba(79,195,247,0.12)' },
  dockBtnLabel: { fontSize: fontSize.xs, color: colors.fg3, fontWeight: '500' },
  captureBtn: {
    width: 76, height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cyan300,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  captureBtnInner: {
    flex: 1, width: '100%',
    borderRadius: 999,
    backgroundColor: colors.cyan300,
  },

  permContainer: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  permIcon: { fontSize: 56 },
  permTitle: { color: colors.fg1, fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center' },
  permSub: { color: colors.fg3, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22 },
  permBtn: {
    backgroundColor: colors.brand, borderRadius: radii.lg,
    paddingVertical: 14, paddingHorizontal: 28, marginTop: 8,
  },
  permBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.base },
});
