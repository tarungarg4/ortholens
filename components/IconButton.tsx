import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  size?: number;
}

export default function IconButton({ children, onPress, active, size = 40 }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.btn,
        { width: size, height: size },
        active && styles.active,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: 'rgba(79,195,247,0.15)',
    borderColor: 'rgba(79,195,247,0.4)',
  },
});
