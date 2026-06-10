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
      <Stack.Screen name="gender" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="pace" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
