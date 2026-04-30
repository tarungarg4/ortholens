import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface Props {
  opacity: number;
  onOpacityChange: (v: number) => void;
  flipped: boolean;
  onFlip: () => void;
  onReset: () => void;
  onCapture: () => void;
}

export default function ControlsBar({
  opacity,
  onOpacityChange,
  flipped,
  onFlip,
  onReset,
  onCapture,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Opacity</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={opacity}
          onValueChange={onOpacityChange}
          minimumTrackTintColor="#4fc3f7"
          maximumTrackTintColor="#555"
          thumbTintColor="#4fc3f7"
        />
        <Text style={styles.pct}>{Math.round(opacity * 100)}%</Text>
      </View>
      <View style={styles.buttonRow}>
        <Btn label={flipped ? 'Unflip' : 'Flip H'} onPress={onFlip} />
        <Btn label="Reset" onPress={onReset} />
        <Btn label="Capture" onPress={onCapture} accent />
      </View>
    </View>
  );
}

function Btn({
  label,
  onPress,
  accent,
}: {
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.btn, accent && styles.btnAccent]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.btnText, accent && styles.btnTextAccent]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10,10,10,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    width: 52,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  pct: {
    color: '#fff',
    fontSize: 12,
    width: 34,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnAccent: {
    backgroundColor: '#4fc3f7',
    borderColor: '#4fc3f7',
  },
  btnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  btnTextAccent: {
    color: '#000',
  },
});
