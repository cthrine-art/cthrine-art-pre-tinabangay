import { StatusBar } from 'react-native';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/create-account" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="(auth)/verify-identity" />

        {/* Worker */}
        <Stack.Screen name="worker/worker-home" />
        <Stack.Screen name="worker/account" />
        <Stack.Screen name="worker/worker-profile" />
        <Stack.Screen name="worker/browse-job" />
        <Stack.Screen name="worker/worker-job-request" />
        <Stack.Screen name="worker/worker-history" />
        <Stack.Screen name="worker/change-password" />
        <Stack.Screen name="worker/worker-alert" />
        <Stack.Screen name="worker/worker-notification" />
        <Stack.Screen name="worker/worker-settings" />

        {/* Employer */}
        <Stack.Screen name="employer/employer-home" />

        {/* Admin */}
        <Stack.Screen name="admin/admin-dashboard" />
        <Stack.Screen name="admin/admin-accounts" />
        <Stack.Screen name="admin/admin-verifications" />
      </Stack>
    </>
  );
}