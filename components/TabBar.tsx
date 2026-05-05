import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, radii } from '../theme';

export type TabId = 'cases' | 'capture' | 'profile';

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
}

function IconLayers({ stroke }: { stroke: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" />
      <Path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </Svg>
  );
}

function IconAperture({ stroke }: { stroke: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.75}>
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

function IconUser({ stroke }: { stroke: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

export default function TabBar({ active, onChange }: Props) {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'cases',   label: 'Cases' },
    { id: 'capture', label: 'Capture' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        const isCenter = t.id === 'capture';
        const stroke = isCenter
          ? (isActive ? colors.bg : colors.brand)
          : (isActive ? colors.brand : colors.fg3);

        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => onChange(t.id)}
            activeOpacity={0.7}
            style={[styles.tab, isCenter && styles.centerTab, isCenter && isActive && styles.centerTabActive]}
          >
            {t.id === 'cases'   && <IconLayers stroke={stroke} />}
            {t.id === 'capture' && <IconAperture stroke={stroke} />}
            {t.id === 'profile' && <IconUser stroke={stroke} />}
            {!isCenter && (
              <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(10,18,32,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.border1,
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    padding: 8,
    borderRadius: radii.sm,
  },
  centerTab: {
    padding: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surface3,
  },
  centerTabActive: {
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  label: { fontSize: 10, fontWeight: '500', letterSpacing: 0.4, color: colors.fg3 },
  labelActive: { color: colors.brand },
});
