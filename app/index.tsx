import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useXrayLibrary, XRayEntry } from '../hooks/useXrayLibrary';

const COLS = 2;
const GAP = 12;
const PADDING = 16;
const TILE = (Dimensions.get('window').width - PADDING * 2 - GAP * (COLS - 1)) / COLS;

export default function HomeScreen() {
  const router = useRouter();
  const { library, loading, removeXRay, renameXRay } = useXrayLibrary();
  const [renameTarget, setRenameTarget] = useState<XRayEntry | null>(null);
  const [renameText, setRenameText] = useState('');

  function openOverlay(entry: XRayEntry) {
    router.push({ pathname: '/overlay', params: { uri: entry.uri, label: entry.label } });
  }

  function confirmDelete(entry: XRayEntry) {
    Alert.alert('Delete X-Ray', `Remove "${entry.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeXRay(entry.id) },
    ]);
  }

  function startRename(entry: XRayEntry) {
    setRenameTarget(entry);
    setRenameText(entry.label);
  }

  async function commitRename() {
    if (renameTarget && renameText.trim()) {
      await renameXRay(renameTarget.id, renameText.trim());
    }
    setRenameTarget(null);
  }

  const renderItem = ({ item }: { item: XRayEntry }) => (
    <TouchableOpacity style={styles.tile} onPress={() => openOverlay(item)} activeOpacity={0.8}>
      <Image source={{ uri: item.uri }} style={styles.tileImg} resizeMode="cover" />
      <View style={styles.tileFooter}>
        <Text style={styles.tileLabel} numberOfLines={1}>
          {item.label}
        </Text>
        <View style={styles.tileActions}>
          <TouchableOpacity onPress={() => startRename(item)} hitSlop={8}>
            <Text style={styles.tileAction}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={8}>
            <Text style={styles.tileAction}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading…</Text>
        </View>
      ) : library.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🩻</Text>
          <Text style={styles.emptyText}>No X-rays yet</Text>
          <Text style={styles.emptySubtext}>
            Import an X-ray to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={library}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/import')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+ Import X-Ray</Text>
      </TouchableOpacity>

      <Modal visible={!!renameTarget} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename X-Ray</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              placeholderTextColor="#555"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setRenameTarget(null)} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={commitRename} style={[styles.modalBtn, styles.modalBtnAccent]}>
                <Text style={[styles.modalBtnText, { color: '#000' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  grid: { padding: PADDING, gap: GAP },
  row: { gap: GAP },
  tile: {
    width: TILE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  tileImg: { width: TILE, height: TILE },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  tileLabel: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '500' },
  tileActions: { flexDirection: 'row', gap: 6 },
  tileAction: { fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 64 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#666', fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#000', fontWeight: '700', fontSize: 15 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 24,
    width: '80%',
    gap: 16,
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 14,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalBtnAccent: { backgroundColor: '#4fc3f7', borderColor: '#4fc3f7' },
  modalBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
