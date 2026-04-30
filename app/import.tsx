import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useXrayLibrary } from '../hooks/useXrayLibrary';

export default function ImportScreen() {
  const router = useRouter();
  const { addXRay } = useXrayLibrary();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed to import X-rays.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
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
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
    });
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
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', 'Failed to save X-ray. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Select X-Ray Image</Text>
      <View style={styles.sourceRow}>
        <SourceBtn icon="🖼️" label="Photo Library" onPress={pickFromGallery} />
        <SourceBtn icon="📷" label="Camera" onPress={captureWithCamera} />
      </View>

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
          <TouchableOpacity style={styles.changeBtn} onPress={pickFromGallery}>
            <Text style={styles.changeBtnText}>Change Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🩻</Text>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Label</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. Chest PA — Patient A"
        placeholderTextColor="#555"
        returnKeyType="done"
      />

      <TouchableOpacity
        style={[styles.saveBtn, (!imageUri || saving) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!imageUri || saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.saveBtnText}>Save to Library</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function SourceBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sourceBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.sourceBtnIcon}>{icon}</Text>
      <Text style={styles.sourceBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, gap: 16 },
  sectionTitle: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  sourceRow: { flexDirection: 'row', gap: 12 },
  sourceBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sourceBtnIcon: { fontSize: 28 },
  sourceBtnLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  previewContainer: { gap: 10, alignItems: 'center' },
  preview: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  changeBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  changeBtnText: { color: '#4fc3f7', fontSize: 13 },
  placeholder: {
    height: 200,
    backgroundColor: '#111',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
  },
  placeholderIcon: { fontSize: 40 },
  placeholderText: { color: '#555', fontSize: 14 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
