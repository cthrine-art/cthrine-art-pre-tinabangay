import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#0F1F3D';

// Same role-based accent used on the Account screen: worker green,
// employer blue, admin teal.
const ACCENT_COLORS: Record<string, string> = {
  Worker: '#2E7D32',
  Employer: '#1D4ED8',
  Admin: '#0F766E',
};

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { userId, role } = useLocalSearchParams<{ userId?: string; role?: string }>();
  const accent = ACCENT_COLORS[role as string] || NAVY;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all three fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    if (!userId) {
      setErrorMessage('No user ID was passed to this screen — please log in again.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/change-password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to change password.');
        return;
      }

      setSuccessMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage('Could not reach the server.');
      console.log('Change password error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: accent + '1A' }]}>
            <Ionicons name="lock-closed-outline" size={28} color={accent} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor="#9CA3AF"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#2E7D32" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: accent }, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: NAVY },
  content: { paddingHorizontal: 24, alignItems: 'center', marginTop: 8 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  field: { width: '100%', marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: NAVY,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  errorText: { fontSize: 12, color: '#DC2626', flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  successText: { fontSize: 12, color: '#2E7D32', flex: 1 },
  submitButton: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});