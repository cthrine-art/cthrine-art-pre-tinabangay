import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#0F1F3D';

const ACCENT_COLORS: Record<string, string> = {
  Worker: '#2E7D32',
  Employer: '#1D4ED8',
  Admin: '#0F766E',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, role } = useLocalSearchParams<{ userId?: string; role?: string }>();

  const accent = ACCENT_COLORS[role as string] || NAVY;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [barangay, setBarangay] = useState('');
  const [editable, setEditable] = useState(true);
  const [roleName, setRoleName] = useState(role || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setErrorMessage('No user ID was passed to this screen — please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/get-profile.php?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.error || 'Failed to load profile.');
          return;
        }

        setFullName(data.fullName || '');
        setEmail(data.email || '');
        setMobileNo(data.mobileNo || '');
        setBarangay(data.barangay || '');
        setEditable(data.editable);
        setRoleName(data.role || '');
      } catch (err) {
        setErrorMessage('Could not reach the server.');
        console.log('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim() || !mobileNo.trim()) {
      Alert.alert('Missing info', 'Full name, email, and mobile number are required.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/update-profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fullName: fullName.trim(),
          email: email.trim(),
          mobileNo: mobileNo.trim(),
          barangay: barangay.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Could not save', data.error || 'Something went wrong.');
        return;
      }

      Alert.alert('Saved', 'Your profile has been updated.', [
        {
          text: 'OK',
          onPress: () => {
            if (role === 'Admin') {
              router.replace('/admin/admin-dashboard');
            } else {
              router.replace({ pathname: '/worker/worker-home', params: { userId } });
            }
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Connection error', 'Could not reach the server.');
      console.log('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const initial = fullName ? fullName.trim().charAt(0).toUpperCase() : '?';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : (
            <>
              <View style={styles.avatarSection}>
                <View style={[styles.avatarCircle, { backgroundColor: accent }]}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: accent + '1A' }]}>
                  <Text style={[styles.roleBadgeText, { color: accent }]}>{roleName}</Text>
                </View>
              </View>

              {!editable ? (
                <View style={styles.noticeBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#B45309" />
                  <Text style={styles.noticeText}>
                    This built-in admin account isn't stored in the database yet, so its
                    profile can't be edited here.
                  </Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput
                  style={[styles.input, !editable && styles.inputDisabled]}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={editable}
                  placeholder="Full name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput
                  style={[styles.input, !editable && styles.inputDisabled]}
                  value={email}
                  onChangeText={setEmail}
                  editable={editable}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>MOBILE NUMBER</Text>
                <TextInput
                  style={[styles.input, !editable && styles.inputDisabled]}
                  value={mobileNo}
                  onChangeText={setMobileNo}
                  editable={editable}
                  placeholder="+63 917 000 0000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>BARANGAY</Text>
                <TextInput
                  style={[styles.input, !editable && styles.inputDisabled]}
                  value={barangay}
                  onChangeText={setBarangay}
                  editable={editable}
                  placeholder="Barangay"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {editable ? (
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: accent }, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveText}>Save changes</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: NAVY },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  errorText: { fontSize: 12, color: '#DC2626', flex: 1 },
  avatarSection: { alignItems: 'center', marginTop: 12, marginBottom: 20, gap: 10 },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF9E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  noticeText: { fontSize: 12, color: '#B45309', flex: 1, lineHeight: 17 },
  field: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: NAVY,
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  saveButton: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});