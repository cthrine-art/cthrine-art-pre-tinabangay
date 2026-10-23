import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

export default function WorkerHomeScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [fullName, setFullName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [matchingJobsCount, setMatchingJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchWorkerStats = async () => {
      if (!userId) {
        setErrorMessage('No user ID was passed to this screen — please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/worker-stats.php?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.error || 'Failed to load your dashboard.');
          return;
        }

        setFullName(data.fullName);
        setIsVerified(data.isVerified);
        setMatchingJobsCount(data.matchingJobsCount);
      } catch (err) {
        setErrorMessage('Could not reach the server.');
        console.log('Worker stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerStats();
  }, [userId]);

  const menuItems: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
  }[] = [
    { label: 'Browse Jobs', icon: 'briefcase-outline', route: '/worker/browse-job' },
    { label: 'Requests', icon: 'paper-plane-outline', route: '/worker/worker-job-request' },
    { label: 'History', icon: 'reader-outline', route: '/worker/worker-history' },
    { label: 'Profile', icon: 'person-outline', route: '/worker/worker-profile' },
    { label: 'Alerts', icon: 'notifications-outline', route: '/worker/worker-alert' },
    { label: 'Settings', icon: 'settings-outline', route: '/worker/worker-settings' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../../assets/tinabangay-logo.png')}
              style={styles.avatar}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.userName}>{loading ? 'Loading...' : fullName || 'Worker'}</Text>
              <Text style={styles.userRole}>INFORMAL WORKER</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() =>
                router.push({
                  pathname: '/worker/worker-alert',
                  params: { userId },
                })
              }
            >
              <Ionicons name="notifications-outline" size={20} color={NAVY} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() =>
                router.push({
                  pathname: '/worker/account',
                  params: { userId, role: 'Worker' },
                })
              }
            >
              <Ionicons name="menu-outline" size={22} color={NAVY} />
            </TouchableOpacity>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>TODAY</Text>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginBottom: 14, alignSelf: 'flex-start' }} />
          ) : (
            <Text style={styles.todayHeadline}>
              {matchingJobsCount} job post{matchingJobsCount === 1 ? '' : 's'} match your skills
            </Text>
          )}
          <View style={styles.todayBadges}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Available</Text>
            </View>
            {isVerified ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>Verified</Text>
              </View>
            ) : (
              <View style={[styles.pill, styles.pillPending]}>
                <Text style={styles.pillText}>Pending verification</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() =>
                router.push({
                  pathname: item.route,
                  params: { userId, role: 'Worker' },
                } as any)
              }
            >
              <View style={styles.gridIconWrap}>
                <Ionicons name={item.icon} size={22} color={NAVY} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const NAVY = '#2E7D32';
const GREEN = '#2E7D32';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  errorText: { fontSize: 12, color: '#DC2626', flex: 1 },
  todayCard: {
    backgroundColor: NAVY,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  todayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  todayHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  todayBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillPending: {
    backgroundColor: 'rgba(180,83,9,0.35)',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
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
    fontSize: 12,
    fontWeight: '600',
    color: NAVY,
  },
});