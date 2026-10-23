import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#0F1F3D';

const ACCENT_COLORS: Record<string, string> = {
  Worker: '#2E7D32',
  Employer: '#1D4ED8',
  Admin: '#0F766E',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { userId, role } = useLocalSearchParams<{ userId?: string; role?: string }>();
  const accent = ACCENT_COLORS[role as string] || NAVY;

  const goTo = (pathname: string) => {
    router.push({ pathname, params: { userId, role } } as any);
  };

  const rows: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }[] = [
    { label: 'Account', icon: 'person-circle-outline', onPress: () => goTo('/worker/account') },
    {
      label: 'Notification preferences',
      icon: 'notifications-outline',
      onPress: () => goTo('/worker/notification-preferences'),
    },
    {
      label: 'About Tinabangay',
      icon: 'information-circle-outline',
      onPress: () =>
        Alert.alert(
          'About Tinabangay',
          'A community-based platform connecting informal workers, employers, and NGO partners across Cebu City barangays.'
        ),
    },
    {
      label: 'Privacy Policy',
      icon: 'shield-outline',
      onPress: () => Alert.alert('Privacy Policy', 'Not available yet.'),
    },
    {
      label: 'App version',
      icon: 'phone-portrait-outline',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.list}>
          {rows.map((row, index) => (
            <TouchableOpacity
              key={row.label}
              style={[styles.row, index !== rows.length - 1 && styles.rowDivider]}
              onPress={row.onPress}
              disabled={row.label === 'App version'}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: accent + '1A' }]}>
                <Ionicons name={row.icon} size={18} color={accent} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.label === 'App version' ? (
                <Text style={styles.rowTrailing}>1.0.0</Text>
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: NAVY },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: NAVY },
  rowTrailing: { fontSize: 12, color: '#9CA3AF' },
});