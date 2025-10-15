import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { GroupProvider } from '../src/context/GroupContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GroupProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </GroupProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
