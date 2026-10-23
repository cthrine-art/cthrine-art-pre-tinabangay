import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Web (browser) reaches your XAMPP server via localhost.
// The Android emulator needs 10.0.2.2 instead.
// If testing on a real phone via Expo Go, replace both with your computer's
// actual local network IP, e.g. 'http://192.168.1.107/tinabangay-api'.
const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState([
    { label: 'USERS', value: '—' },
    { label: 'JOBS', value: '—' },
    { label: 'PENDING', value: '—' },
  ]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stats.php`);
        const data = await response.json();

        if (!response.ok) {
          setStatsError(data.error || 'Failed to load stats.');
          return;
        }

        setStats([
          { label: 'USERS', value: String(data.users) },
          { label: 'JOBS', value: String(data.jobs) },
          { label: 'PENDING', value: String(data.pending) },
        ]);
      } catch (err) {
        setStatsError('Could not reach the server for stats.');
        console.log('Stats fetch error:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Reflects the admin's defined scope:
  // - manage user accounts
  // - verify non-beneficiary users
  // - monitor platform activities
  // - review only REPORTED conversations to investigate complaints
  // - generate administrative reports
  const menuItems: {
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
  }[] = [
    {
      label: 'Accounts',
      description: 'Manage user accounts',
      icon: 'people-outline',
      route: '/admin/admin-accounts',
    },
    {
      label: 'Verifications',
      description: 'Verify non-beneficiary users',
      icon: 'shield-checkmark-outline',
      route: '/admin/admin-verifications',
    },
    {
      label: 'Activity Monitor',
      description: 'Monitor platform activities',
      icon: 'pulse-outline',
      route: '/admin-activity',
    },
    {
      label: 'Reported Chats',
      description: 'Review reported conversations only',
      icon: 'flag-outline',
      route: '/admin-reported-chats',
    },
    {
      label: 'Reports',
      description: 'Generate administrative reports',
      icon: 'clipboard-outline',
      route: '/admin-reports',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() =>
              router.push({ pathname: '/worker/account', params: { userId: '0', role: 'Admin' } })
            }
          >
            <Image
              source={require('../../../assets/tinabangay-logo.png')}
              style={styles.avatar}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.userName}>System Admin</Text>
              <Text style={styles.userRole}>ADMINISTRATOR</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push({ pathname: '/worker/alerts', params: { userId: '0' } } as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              {loadingStats ? (
                <ActivityIndicator size="small" color={NAVY} />
              ) : (
                <Text style={styles.statValue}>{stat.value}</Text>
              )}
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {statsError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{statsError}</Text>
          </View>
        ) : null}

        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={16} color="#B45309" />
          <Text style={styles.noticeText}>
            Admins review only reported conversations to investigate
            complaints, in accordance with platform policy.
          </Text>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.gridIconWrap}>
                <Ionicons name={item.icon} size={22} color={NAVY} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
              <Text style={styles.gridDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: GREEN,
    letterSpacing: 0.5,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
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
  noticeText: {
    fontSize: 12,
    color: '#B45309',
    flex: 1,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  gridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 4,
    textAlign: 'center',
  },
  gridDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 14,
  },
});