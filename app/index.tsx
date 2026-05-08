import React, { useState, useCallback } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useXrayLibrary } from '../hooks/useXrayLibrary';
import TabBar, { TabId } from '../components/TabBar';
import CasesTab from '../components/tabs/CasesTab';
import CaptureTab from '../components/tabs/CaptureTab';
import ProfileTab from '../components/tabs/ProfileTab';

const { width: SW } = Dimensions.get('window');
const TABS: TabId[] = ['cases', 'capture', 'profile'];

export default function HomeScreen() {
  const { library, loading, addXRay, removeXRay, clearAll, reload } = useXrayLibrary();
  const [activeTab, setActiveTab] = useState<TabId>('cases');
  const translateX = useSharedValue(0);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  function handleTabChange(id: TabId) {
    const idx = TABS.indexOf(id);
    translateX.value = withTiming(-idx * SW, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    setActiveTab(id);
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.viewport}>
        <Animated.View style={[styles.strip, animStyle]}>
          <View style={styles.tab}>
            <CasesTab
              library={library}
              loading={loading}
              removeXRay={removeXRay}
              onImport={() => handleTabChange('capture')}
            />
          </View>
          <View style={styles.tab}>
            <CaptureTab addXRay={addXRay} onSaved={() => handleTabChange('cases')} />
          </View>
          <View style={styles.tab}>
            <ProfileTab library={library} loading={loading} clearAll={clearAll} />
          </View>
        </Animated.View>
      </View>
      <TabBar active={activeTab} onChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05080f' },
  viewport: { flex: 1, overflow: 'hidden' },
  strip: { flexDirection: 'row', width: SW * 3, flex: 1 },
  tab: { width: SW, flex: 1 },
});
