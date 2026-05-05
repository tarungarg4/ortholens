import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, tracking } from '../theme';

interface Props {
  title: string;
  eyebrow?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export default function AppHeader({ title, eyebrow, leading, trailing }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {leading}
        <View>
          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      {trailing && <View style={styles.right}>{trailing}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border1,
    backgroundColor: colors.bg,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    letterSpacing: tracking.caps,
    textTransform: 'uppercase',
    color: colors.fg3,
    fontWeight: '500',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    letterSpacing: tracking.tight,
    color: colors.fg1,
  },
});
