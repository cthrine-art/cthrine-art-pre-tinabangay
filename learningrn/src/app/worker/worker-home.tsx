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
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#2E7D32';
const GREEN = '#2E7D32';

export default function WorkerHomeScreen() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId?: string;
  }>();

  const [fullName, setFullName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [matchingJobsCount, setMatchingJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchWorkerStats = async () => {
      if (!userId) {
        setErrorMessage(
          'No user ID was passed to this screen — please log in again.'
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/worker-stats.php?userId=${userId}`
        );

        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(
            data.error || 'Failed to load your dashboard.'
          );
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
    {
      label: 'Browse Jobs',
      icon: 'briefcase-outline',
      route: '/worker/browse-job',
    },
    {
      label: 'Requests',
      icon: 'paper-plane-outline',
      route: '/worker/worker-job-request',
    },
    {
      label: 'History',
      icon: 'reader-outline',
      route: '/worker/worker-history',
    },
    {
      label: 'Profile',
      icon: 'person-outline',
      route: '/worker/worker-profile',
    },
    {
      label: 'Alerts',
      icon: 'notifications-outline',
      route: '/worker/worker-alert',
    },
    {
      label: 'Settings',
      icon: 'settings-outline',
      route: '/worker/worker-settings',
    },
  ];

  const openWorkerPage = (route: string) => {
    router.push({
      pathname: route as any,
      params: {
        userId,
        role: 'Worker',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../../assets/tinabangay-logo.png')}
              style={styles.avatar}
              resizeMode="contain"
            />

            <View style={styles.nameContainer}>
              <Text
                style={styles.userName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {loading ? 'Loading...' : fullName || 'Worker'}
              </Text>

              <Text style={styles.userRole}>
                JOB SEEKERS
              </Text>
            </View>
          </View>

          {/* NOTIFICATIONS */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => openWorkerPage('/worker/worker-alert')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={NAVY}
            />
          </TouchableOpacity>
        </View>

        {/* AVAILABILITY */}
        <TouchableOpacity
          style={styles.availabilityCard}
          onPress={() => openWorkerPage('/worker/worker-availability')}
          activeOpacity={0.8}
        >
          <View style={styles.availabilityLeft}>
            <View style={styles.availabilityIcon}>
              <Ionicons
                name="radio-button-on"
                size={18}
                color={GREEN}
              />
            </View>

            <View>
              <Text style={styles.availabilityLabel}>
                AVAILABILITY
              </Text>

              <Text style={styles.availabilityText}>
                Available
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={NAVY}
          />
        </TouchableOpacity>

        {/* WORKER DASHBOARD CARD */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>
            WORKER DASHBOARD
          </Text>

          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
              style={{
                marginBottom: 14,
                alignSelf: 'flex-start',
              }}
            />
          ) : (
            <Text style={styles.todayHeadline}>
              {matchingJobsCount} job post
              {matchingJobsCount === 1 ? '' : 's'} match your skills
            </Text>
          )}

          <View style={styles.todayBadges}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                Available
              </Text>
            </View>

            {isVerified ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  Verified
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.pill,
                  styles.pillPending,
                ]}
              >
                <Text style={styles.pillText}>
                  Pending verification
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ERROR MESSAGE */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color="#DC2626"
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* WORKER SERVICES */}
        <Text style={styles.sectionTitle}>
          WORKER SERVICES
        </Text>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => openWorkerPage(item.route)}
              activeOpacity={0.8}
            >
              <View style={styles.gridIconWrap}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={NAVY}
                />
              </View>

              <Text style={styles.gridLabel}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },

  /*
   * Same positioning as Employer Home
   */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 35,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },

  nameContainer: {
    flex: 1,
  },

  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },

  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: GREEN,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  /* AVAILABILITY */
  availabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E7E4DE',
  },

  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  availabilityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  availabilityLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A8F94',
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  availabilityText: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN,
  },

  /* DASHBOARD CARD */
  todayCard: {
    backgroundColor: NAVY,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },

  todayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 7,
  },

  todayHeadline: {
    fontSize: 17,
    lineHeight: 23,
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
    fontSize: 11,
    fontWeight: '600',
  },

  /* ERROR */
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

  /* SECTION */
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A7F84',
    letterSpacing: 0.9,
    marginBottom: 12,
  },

  /* SERVICES GRID */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  gridItem: {
    width: '48%',
    minHeight: 115,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#EEEAE4',
  },

  gridIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: NAVY,
    textAlign: 'center',
  },
});