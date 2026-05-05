import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { XRayEntry } from '../../hooks/useXrayLibrary';
import AppHeader from '../AppHeader';
import { colors, radii, space, fontSize, tracking } from '../../theme';

function IconPhoto() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.cyan300} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
      <Circle cx={8.5} cy={8.5} r={1.5} />
      <Path d="M21 15l-5-5L5 21" />
    </Svg>
  );
}
function IconCamera() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.cyan300} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

interface Props {
  addXRay: (uri: string, label: string) => Promise<XRayEntry>;
  onSaved: () => void;
}

export default function CaptureTab({ addXRay, onSaved }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed to import X-rays.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: false });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      if (!label) setLabel(`X-Ray ${new Date().toLocaleDateString()}`);
    }
  }

  async function captureWithCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to photograph X-ray film.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      if (!label) setLabel(`X-Ray ${new Date().toLocaleDateString()}`);
    }
  }

  async function handleSave() {
    if (!imageUri) return;
    const finalLabel = label.trim() || `X-Ray ${new Date().toLocaleDateString()}`;
    setSaving(true);
    try {
      await addXRay(imageUri, finalLabel);
      setImageUri(null);
      setLabel('');
      onSaved();
    } catch {
      Alert.alert('Error', 'Failed to save X-ray. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader eyebrow="New Case" title="Import X-Ray" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Select Source</Text>
        <View style={styles.sourceRow}>
          <TouchableOpacity style={styles.sourceBtn} onPress={pickFromGallery} activeOpacity={0.8}>
            <View style={styles.sourceBtnIcon}><IconPhoto /></View>
            <Text style={styles.sourceBtnTitle}>Photo Library</Text>
            <Text style={styles.sourceBtnSub}>Import from gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sourceBtn} onPress={captureWithCamera} activeOpacity={0.8}>
            <View style={styles.sourceBtnIcon}><IconCamera /></View>
            <Text style={styles.sourceBtnTitle}>Camera</Text>
            <Text style={styles.sourceBtnSub}>Photograph X-ray film</Text>
          </TouchableOpacity>
        </View>

        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
            <TouchableOpacity onPress={pickFromGallery} style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🩻</Text>
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Label</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Left knee · pre-op"
          placeholderTextColor={colors.fg4}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.saveBtn, (!imageUri || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!imageUri || saving}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnText}>Save to Cases</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[5], gap: space[4] },
  sectionLabel: {
    fontSize: fontSize.xs, letterSpacing: tracking.caps,
    textTransform: 'uppercase', color: colors.fg3, fontWeight: '500',
  },
  sourceRow: { flexDirection: 'row', gap: space[3] },
  sourceBtn: {
    flex: 1, backgroundColor: colors.surface1, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border2, padding: space[4],
    alignItems: 'center', gap: space[2],
  },
  sourceBtnIcon: {
    width: 52, height: 52, borderRadius: radii.md,
    backgroundColor: colors.cyan700, borderWidth: 1, borderColor: colors.border3,
    alignItems: 'center', justifyContent: 'center',
  },
  sourceBtnTitle: { color: colors.fg1, fontSize: fontSize.sm, fontWeight: '600' },
  sourceBtnSub: { color: colors.fg3, fontSize: fontSize.xs, textAlign: 'center' },
  previewContainer: { gap: space[3], alignItems: 'center' },
  preview: {
    width: '100%', height: 260, borderRadius: radii.lg,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border3,
  },
  changeBtn: { paddingHorizontal: space[4], paddingVertical: space[2] },
  changeBtnText: { color: colors.cyan300, fontSize: fontSize.sm },
  placeholder: {
    height: 180, backgroundColor: colors.surface1, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: space[2],
  },
  placeholderIcon: { fontSize: 36 },
  placeholderText: { color: colors.fg4, fontSize: fontSize.sm },
  input: {
    backgroundColor: colors.surface1, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border2,
    paddingHorizontal: space[4], paddingVertical: space[3],
    color: colors.fg1, fontSize: fontSize.base,
  },
  saveBtn: {
    backgroundColor: colors.brand, borderRadius: radii.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: space[2],
    shadowColor: colors.brand, shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  saveBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.base },
});
