import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Tone = 'success' | 'warning' | 'danger' | 'info';

const TONES = {
  success: { bg: 'rgba(52,211,153,0.12)', fg: '#34d399', border: 'rgba(52,211,153,0.3)' },
  warning: { bg: 'rgba(251,191,36,0.12)',  fg: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  danger:  { bg: 'rgba(248,113,113,0.12)', fg: '#f87171', border: 'rgba(248,113,113,0.3)' },
  info:    { bg: 'rgba(79,195,247,0.12)',  fg: '#4fc3f7', border: 'rgba(79,195,247,0.3)' },
};

interface Props {
  tone?: Tone;
  children: React.ReactNode;
}

export default function StatusPill({ tone = 'info', children }: Props) {
  const c = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[styles.dot, { backgroundColor: c.fg }]} />
      <Text style={[styles.label, { color: c.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
