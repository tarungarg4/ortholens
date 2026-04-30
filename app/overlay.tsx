import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useOverlayGesture } from '../hooks/useOverlayGesture';
import ControlsBar from '../components/ControlsBar';

const { width: SW, height: SH } = Dimensions.get('window');

export default function OverlayScreen() {
  const router = useRouter();
  const { uri, label } = useLocalSearchParams<{ uri: string; label: string }>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [opacity, setOpacity] = useState(0.5);
  const [flipped, setFlipped] = useState(false);
  const sceneRef = useRef<View>(null);
  const { composedGesture, animatedStyle, reset } = useOverlayGesture();

  if (!cameraPermission) return <View style={styles.bg} />;

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>
          MedOverlay needs camera access to overlay X-ray images on the patient's body.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestCameraPermission}>
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleCapture() {
    try {
      const captured = await captureRef(sceneRef, { format: 'jpg', quality: 0.95 });
      await Sharing.shareAsync(captured, { mimeType: 'image/jpeg', dialogTitle: 'Save or share overlay' });
    } catch {
      Alert.alert('Error', 'Failed to capture. Please try again.');
    }
  }

  return (
    <View style={styles.bg}>
      <Stack.Screen options={{ headerShown: false }} />
      <View ref={sceneRef} style={styles.scene} collapsable={false}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" />

        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.overlay, animatedStyle]}>
            <Animated.Image
              source={{ uri }}
              style={[
                styles.overlayImage,
                { opacity },
                flipped && { transform: [{ scaleX: -1 }] },
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
          <View style={{ width: 64 }} />
        </View>
      </View>

      <ControlsBar
        opacity={opacity}
        onOpacityChange={setOpacity}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        onReset={reset}
        onCapture={handleCapture}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  scene: {
    flex: 1,
    width: SW,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    width: SW,
    height: SH * 0.7,
    top: SH * 0.05,
    left: 0,
  },
  overlayImage: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: { width: 64 },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  labelText: { flex: 1, color: '#fff', fontSize: 13, textAlign: 'center', opacity: 0.85 },
  permContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permIcon: { fontSize: 56 },
  permTitle: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  permSub: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  permBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  permBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
