import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { XRayEntry } from '../../hooks/useXrayLibrary';
import AppHeader from '../AppHeader';
import { colors, radii, space, fontSize, tracking } from '../../theme';

function IconUser() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.cyan200} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
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
  clearAll: () => Promise<void>;
}

export default function ProfileTab({ library, loading, clearAll }: Props) {
  function confirmClearAll() {
    if (library.length === 0) {
      Alert.alert('No Cases', 'There are no saved cases to clear.');
      return;
    }
    Alert.alert(
      'Clear All Cases',
      `Permanently delete all ${library.length} case${library.length !== 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAll },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader eyebrow="OrthoLens" title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.avatarCard}>
          <View style={styles.avatar}><IconUser /></View>
          <View style={styles.avatarMeta}>
            <Text style={styles.avatarName}>Dr. [Your Name]</Text>
            <Text style={styles.avatarRole}>Orthopedic Surgeon</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Storage</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Cases saved</Text>
            <Text style={styles.rowValue}>{loading ? '…' : library.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Data location</Text>
            <Text style={styles.rowValue}>On-device only</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Cloud sync</Text>
            <Text style={styles.rowValue}>Off</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Data Management</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={confirmClearAll} activeOpacity={0.7}>
            <IconTrash />
            <Text style={styles.dangerLabel}>Clear All Cases</Text>
            <View style={styles.flex1} />
            <IconChevron />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App</Text>
            <Text style={styles.rowValue}>OrthoLens</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            For clinical reference only. Not intended as a primary diagnostic tool. Always apply professional clinical judgement.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[5], gap: space[4] },
  avatarCard: {
    flexDirection: 'row', alignItems: 'center', gap: space[4],
    backgroundColor: colors.surface1, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border2, padding: space[4],
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.cyan700, borderWidth: 1, borderColor: colors.border3,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarMeta: { gap: 4 },
  avatarName: { color: colors.fg1, fontSize: fontSize.md, fontWeight: '700' },
  avatarRole: { color: colors.cyan300, fontSize: fontSize.sm },
  sectionLabel: {
    fontSize: fontSize.xs, letterSpacing: tracking.caps,
    textTransform: 'uppercase', color: colors.fg3, fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface1, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border2, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space[4], paddingVertical: 14,
  },
  rowLabel: { color: colors.fg2, fontSize: fontSize.sm },
  rowValue: { color: colors.fg3, fontSize: fontSize.sm },
  divider: { height: 1, backgroundColor: colors.border1, marginHorizontal: space[4] },
  dangerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space[4], paddingVertical: 14, gap: space[3],
  },
  dangerLabel: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '500' },
  flex1: { flex: 1 },
  disclaimer: {
    backgroundColor: colors.surface1, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border1, padding: space[4], marginTop: space[2],
  },
  disclaimerText: { color: colors.fg4, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
