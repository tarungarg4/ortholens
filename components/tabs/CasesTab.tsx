import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { XRayEntry } from '../../hooks/useXrayLibrary';
import AppHeader from '../AppHeader';
import StatusPill from '../StatusPill';
import IconButton from '../IconButton';
import { colors, radii, space, fontSize, tracking } from '../../theme';

function IconPlus() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.fg2} strokeWidth={2} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}
function IconBone() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={colors.cyan200} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 10c.7-.7 1-1.7 1-2.7C18 5.4 16.6 4 14.7 4c-1 0-2 .4-2.7 1.1l-.5.5-.5-.5c-.7-.7-1.7-1.1-2.7-1.1C6.4 4 5 5.4 5 7.3c0 1 .4 2 1 2.7m1.5 4.5l-2 2c-.6.7-.5 1.7.2 2.4a1.7 1.7 0 002.4.2l2-2m4 0l2 2a1.7 1.7 0 002.4-.2c.7-.7.8-1.7.2-2.4l-2-2" />
    </Svg>
  );
}
function IconChevron() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.fg3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

interface Props {
  library: XRayEntry[];
  loading: boolean;
  renameXRay: (id: string, label: string) => Promise<void>;
  removeXRay: (id: string) => Promise<void>;
  onImport: () => void;
}

export default function CasesTab({ library, loading, renameXRay, removeXRay, onImport }: Props) {
  const router = useRouter();
  const [renameTarget, setRenameTarget] = useState<XRayEntry | null>(null);
  const [renameText, setRenameText] = useState('');

  function openOverlay(entry: XRayEntry) {
    router.push({ pathname: '/overlay', params: { uri: entry.uri, label: entry.label } });
  }

  function showOptions(item: XRayEntry) {
    Alert.alert(item.label, 'Choose an action', [
      { text: 'Rename', onPress: () => { setRenameTarget(item); setRenameText(item.label); } },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Case', `Delete "${item.label}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => removeXRay(item.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function commitRename() {
    if (renameTarget && renameText.trim()) {
      await renameXRay(renameTarget.id, renameText.trim());
    }
    setRenameTarget(null);
  }

  const renderItem = ({ item }: { item: XRayEntry }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openOverlay(item)}
      onLongPress={() => showOptions(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardIcon}><IconBone /></View>
      <View style={styles.cardBody}>
        <Text style={styles.cardId} numberOfLines={1}>{item.id}</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.label}</Text>
        <Text style={styles.cardSub}>
          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <StatusPill tone="info">Ready</StatusPill>
      <IconChevron />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        eyebrow="OrthoLens"
        title="Cases"
        trailing={<IconButton onPress={onImport}><IconPlus /></IconButton>}
      />
      {loading ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>Loading…</Text></View>
      ) : library.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}><IconBone /></View>
          <Text style={styles.emptyTitle}>No X-rays yet</Text>
          <Text style={styles.emptySub}>Import an X-ray to start a case</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={onImport} activeOpacity={0.8}>
            <Text style={styles.emptyBtnText}>+ Import X-Ray</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={library}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

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
              placeholderTextColor={colors.fg4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setRenameTarget(null)} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={commitRename} style={[styles.modalBtn, styles.modalBtnAccent]}>
                <Text style={[styles.modalBtnText, { color: colors.bg }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: space[4], gap: space[3] },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: space[3] + 2,
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.border2,
    borderRadius: radii.lg, padding: space[4],
  },
  cardIcon: {
    width: 56, height: 56, borderRadius: radii.md,
    backgroundColor: colors.cyan700, borderWidth: 1, borderColor: colors.border3,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardId: { fontSize: fontSize.xs, letterSpacing: tracking.wide, color: colors.cyan300, fontWeight: '500' },
  cardTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.fg1, marginTop: 2 },
  cardSub: { fontSize: fontSize.xs, color: colors.fg3, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[2] },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: radii.xl,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2,
    alignItems: 'center', justifyContent: 'center', marginBottom: space[2],
  },
  emptyTitle: { color: colors.fg1, fontSize: fontSize.lg, fontWeight: '600' },
  emptySub: { color: colors.fg3, fontSize: fontSize.sm },
  emptyBtn: {
    marginTop: space[3], backgroundColor: colors.brand,
    paddingHorizontal: space[6], paddingVertical: space[3], borderRadius: radii.pill,
  },
  emptyBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.base },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { backgroundColor: colors.surface2, borderRadius: radii.lg, padding: space[6], width: '80%', gap: space[4] },
  modalTitle: { color: colors.fg1, fontSize: fontSize.md, fontWeight: '700' },
  modalInput: { borderWidth: 1, borderColor: colors.border2, borderRadius: radii.sm, padding: space[3], color: colors.fg1, fontSize: fontSize.sm },
  modalActions: { flexDirection: 'row', gap: space[3] },
  modalBtn: { flex: 1, borderWidth: 1, borderColor: colors.border2, borderRadius: radii.sm, paddingVertical: space[3], alignItems: 'center' },
  modalBtnAccent: { backgroundColor: colors.brand, borderColor: colors.brand },
  modalBtnText: { color: colors.fg1, fontWeight: '600', fontSize: fontSize.sm },
});
