import { useRef } from 'react';
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

export function useOverlayGesture() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Save values at gesture start so deltas apply correctly when simultaneous
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTX.value = translateX.value;
      savedTY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTX.value + e.translationX;
      translateY.value = savedTY.value + e.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(0.1, Math.min(10, savedScale.value * e.scale));
    });

  const rotateGesture = Gesture.Rotation()
    .onStart(() => {
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  const reset = () => {
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    rotation.value = 0;
  };

  const getSnapshot = () => ({
    translateX: translateX.value,
    translateY: translateY.value,
    scale: scale.value,
    rotation: rotation.value,
  });

  return { composedGesture, animatedStyle, reset, getSnapshot };
}
