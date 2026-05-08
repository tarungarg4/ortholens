import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useXrayLibrary, CaptureEntry } from '../hooks/useXrayLibrary';
import { colors, radii, space, fontSize, tracking } from '../theme';

const BODY_TAGS = ['Knee', 'Hip', 'Spine', 'Shoulder', 'Ankle', 'Wrist', 'Elbow', 'Hand', 'Foot'];

function IconBack() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.fg1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
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
function IconTrash() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </Svg>
  );
}

export default function EditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { library, loading, updateXRay, removeXRay } = useXrayLibrary();

  const entry = library.find(e => e.id === id);

  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [inverted, setInverted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setLabel(entry.label);
      setNotes(entry.notes ?? '');
      setTags(entry.tags ?? []);
      setInverted(entry.inverted ?? false);
    }
  }, [entry?.id]);

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handleSave() {
    if (!entry) return;
    setSaving(true);
    try {
      await updateXRay(id, {
        label: label.trim() || entry.label,
        notes: notes.trim(),
        tags,
        inverted,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Case',
      `Delete "${entry?.label}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await removeXRay(id);
            router.back();
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.cyan300} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Case not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backFallback}>
          <Text style={styles.backFallbackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <IconBack />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={styles.eyebrow}>Edit Case</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{entry.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Thumbnail */}
        <Image source={{ uri: entry.uri }} style={styles.thumbnail} resizeMode="contain" />

        {/* Label */}
        <Text style={styles.sectionLabel}>Label</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Left knee · pre-op"
          placeholderTextColor={colors.fg4}
          returnKeyType="done"
        />

        {/* Body Region */}
        <Text style={styles.sectionLabel}>Body Region</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
          {BODY_TAGS.map(tag => {
            const active = tags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Clinical notes, implant sizing, laterality…"
          placeholderTextColor={colors.fg4}
          multiline
          textAlignVertical="top"
          returnKeyType="default"
        />

        {/* Overlay Defaults */}
        <Text style={styles.sectionLabel}>Overlay Defaults</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchMeta}>
              <Text style={styles.switchLabel}>Invert X-ray</Text>
              <Text style={styles.switchSub}>Flip dark/light for film scans</Text>
            </View>
            <Switch
              value={inverted}
              onValueChange={setInverted}
              trackColor={{ false: colors.surface4, true: colors.cyan300 }}
              thumbColor={colors.fg1}
            />
          </View>
        </View>

        {/* Captures */}
        <Text style={styles.sectionLabel}>
          Captures{entry.captures?.length ? ` · ${entry.captures.length}` : ''}
        </Text>
        {!entry.captures?.length ? (
          <Text style={styles.emptyCaptures}>No captures yet — open the overlay and tap ◉</Text>
        ) : (
          <View style={styles.card}>
            {entry.captures.map((cap, idx) => (
              <React.Fragment key={cap.id}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.captureRow}
                  onPress={() => router.push({ pathname: '/annotate', params: { caseId: id, captureId: cap.id } })}
                  activeOpacity={0.75}
                >
                  <Image source={{ uri: cap.uri }} style={styles.captureThumbnail} resizeMode="cover" />
                  <View style={styles.captureInfo}>
                    <Text style={styles.captureDate}>
                      {new Date(cap.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.captureAnnotCount}>
                      {cap.strokes.length > 0 ? `${cap.strokes.length} annotation${cap.strokes.length !== 1 ? 's' : ''}` : 'Unannotated'}
                    </Text>
                  </View>
                  <IconChevron />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={styles.saveBtnText}>Save Changes</Text>
          }
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} activeOpacity={0.7}>
          <IconTrash />
          <Text style={styles.deleteBtnText}>Delete Case</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: space[3] },
  errorText: { color: colors.fg3, fontSize: fontSize.sm },
  backFallback: { paddingHorizontal: space[4], paddingVertical: space[2] },
  backFallbackText: { color: colors.cyan300, fontSize: fontSize.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 56,
    paddingHorizontal: space[4],
    paddingBottom: space[4],
    gap: space[3],
    backgroundColor: 'rgba(5,8,15,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border1,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: colors.border2,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  headerMeta: { flex: 1, gap: 2 },
  eyebrow: {
    fontSize: fontSize.xs, letterSpacing: tracking.caps,
    textTransform: 'uppercase', color: colors.cyan300, fontWeight: '500',
  },
  headerTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.fg1 },

  content: { padding: space[5], gap: space[4], paddingBottom: space[12] },

  thumbnail: {
    width: '100%', height: 160, borderRadius: radii.lg,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2,
  },

  sectionLabel: {
    fontSize: fontSize.xs, letterSpacing: tracking.caps,
    textTransform: 'uppercase', color: colors.fg3, fontWeight: '500',
  },

  input: {
    backgroundColor: colors.surface1, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border2,
    paddingHorizontal: space[4], paddingVertical: space[3],
    color: colors.fg1, fontSize: fontSize.base,
  },
  notesInput: { minHeight: 100, paddingTop: space[3] },

  tagsRow: { flexDirection: 'row', gap: space[2], paddingVertical: 2 },
  chip: {
    paddingHorizontal: space[4], paddingVertical: space[2],
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border2,
    backgroundColor: colors.surface1,
  },
  chipActive: {
    borderColor: colors.cyan300,
    backgroundColor: 'rgba(79,195,247,0.15)',
  },
  chipText: { fontSize: fontSize.sm, color: colors.fg3, fontWeight: '500' },
  chipTextActive: { color: colors.cyan300 },

  card: {
    backgroundColor: colors.surface1, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border2, overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space[4], paddingVertical: 14, gap: space[3],
  },
  switchMeta: { flex: 1, gap: 2 },
  switchLabel: { color: colors.fg1, fontSize: fontSize.sm, fontWeight: '500' },
  switchSub: { color: colors.fg3, fontSize: fontSize.xs },

  saveBtn: {
    backgroundColor: colors.brand, borderRadius: radii.lg,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.brand, shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  saveBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.base },

  emptyCaptures: { color: colors.fg4, fontSize: fontSize.sm, fontStyle: 'italic' },
  captureRow: {
    flexDirection: 'row', alignItems: 'center', gap: space[3],
    paddingHorizontal: space[4], paddingVertical: space[3],
  },
  captureThumbnail: {
    width: 72, height: 54, borderRadius: radii.md,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border2,
  },
  captureInfo: { flex: 1, gap: 3 },
  captureDate: { fontSize: fontSize.sm, color: colors.fg2, fontWeight: '500' },
  captureAnnotCount: { fontSize: fontSize.xs, color: colors.fg4 },
  divider: { height: 1, backgroundColor: colors.border2, marginHorizontal: space[4] },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: space[2], paddingVertical: space[3],
  },
  deleteBtnText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '500' },
});
