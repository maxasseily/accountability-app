import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="credibility-mojo-intro" />
      <Stack.Screen name="quest-types-intro" />
      <Stack.Screen name="activity-selection" />
      <Stack.Screen name="goal-selection" />
      <Stack.Screen name="frequency-selection" />
      <Stack.Screen name="goal-confirmation" />
    </Stack>
  );
}
