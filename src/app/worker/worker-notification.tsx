import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  Platform,
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

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { userId, role } = useLocalSearchParams<{ userId?: string; role?: string }>();
  const accent = ACCENT_COLORS[role as string] || NAVY;

  const [jobMatches, setJobMatches] = useState(true);
  const [requestUpdates, setRequestUpdates] = useState(true);
  const [messages, setMessages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchPrefs = async () => {
      if (!userId) {
        setErrorMessage('No user ID was passed to this screen — please log in again.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/get-notification-preferences.php?userId=${userId}`
        );
        const data = await response.json();
        if (!response.ok) {
          setErrorMessage(data.error || 'Failed to load preferences.');
          return;
        }
        setJobMatches(data.jobMatches);
        setRequestUpdates(data.requestUpdates);
        setMessages(data.messages);
      } catch (err) {
        setErrorMessage('Could not reach the server.');
        console.log('Preferences fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/update-notification-preferences.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobMatches, requestUpdates, messages }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Could not save', data.error || 'Something went wrong.');
        return;
      }
      Alert.alert('Saved', 'Your notification preferences have been updated.');
    } catch (err) {
      Alert.alert('Connection error', 'Could not reach the server.');
      console.log('Preferences save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    {
      key: 'jobMatches',
      label: 'Job matches',
      description: 'New job posts that match your category',
      value: jobMatches,
      onChange: setJobMatches,
    },
    {
      key: 'requestUpdates',
      label: 'Request updates',
      description: 'Status changes on requests you sent',
      value: requestUpdates,
      onChange: setRequestUpdates,
    },
    {
      key: 'messages',
      label: 'Messages',
      description: 'New messages from employers or admins',
      value: messages,
      onChange: setMessages,
    },
  ];

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
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((row, index) => (
              <View
                key={row.key}
                style={[styles.row, index !== rows.length - 1 && styles.rowDivider]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowDescription}>{row.description}</Text>
                </View>
                <Switch
                  value={row.value}
                  onValueChange={row.onChange}
                  trackColor={{ false: '#E5E7EB', true: accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {!errorMessage && (
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
      )}
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
  headerTitle: { fontSize: 15, fontWeight: '700', color: NAVY },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: { fontSize: 12, color: '#DC2626', flex: 1 },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: NAVY, marginBottom: 2 },
  rowDescription: { fontSize: 11, color: '#9CA3AF' },
  saveButton: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});