import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="goal" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="frequency" />
      <Stack.Screen name="equipment" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
