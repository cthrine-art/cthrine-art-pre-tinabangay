import { StatusBar } from 'react-native';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <>
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />

      <Stack screenOptions={{ headerShown: false }}>
        {/* AUTH */}
        <Stack.Screen name="(auth)/index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/create-account" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="(auth)/verify-identity" />


        {/* WORKER */}
        <Stack.Screen name="worker/worker-home" />
        <Stack.Screen name="worker/account" />
        <Stack.Screen name="worker/worker-profile" />
        <Stack.Screen name="worker/browse-job" />
        <Stack.Screen name="worker/worker-job-request" />
        <Stack.Screen name="worker/worker-history" />
        <Stack.Screen name="worker/worker-alert" />
        <Stack.Screen name="worker/worker-notification" />
        <Stack.Screen name="worker/worker-settings" />
        <Stack.Screen name="worker/change-password" />
        <Stack.Screen name="worker  /job-details" />

        {/* EMPLOYER */}
        <Stack.Screen name="employer/employer-home" />
        <Stack.Screen name="employer/account" />
        <Stack.Screen name="employer/employer-profile" />
        <Stack.Screen name="employer/applicants" />
        <Stack.Screen name="employer/applicant-profile" />
        <Stack.Screen name="employer/availability" />
        <Stack.Screen name="employer/find-workers" />
        <Stack.Screen name="employer/job-history" />
        <Stack.Screen name="employer/job-location" />
        <Stack.Screen name="employer/job-requests" />
        <Stack.Screen name="employer/my-jobs" />
        <Stack.Screen name="employer/notifications" />
        <Stack.Screen name="employer/post-job" />
        <Stack.Screen name="employer/review-job" />
        <Stack.Screen name="employer/reviews" />
        <Stack.Screen name="employer/settings" />
        <Stack.Screen name="employer/worker-profile" />
        <Stack.Screen name="employer/change-password" />

        {/* NGO STAFF */}
        <Stack.Screen name="ngo/ngo-home" />
        <Stack.Screen name="ngo/ngo-verification" />
        <Stack.Screen name="ngo/ngo-beneficiaries" />
        <Stack.Screen name="ngo/ngo-programs" />
        <Stack.Screen name="ngo/ngo-activity" />

        {/* ADMIN */}
        <Stack.Screen name="admin/admin-dashboard" />
        <Stack.Screen name="admin/admin-accounts" />
        <Stack.Screen name="admin/admin-verifications" />
      </Stack>
    </>
  );
}