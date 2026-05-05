import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#05080f' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'OrthoLens' }} />
        <Stack.Screen name="import" options={{ title: 'Import X-Ray' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
