import React from 'react';

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

export default function EmployerHomeScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    userId?: string;
    fullName?: string;
  }>();

  const userId = params.userId ? String(params.userId) : '';

  const fullName = params.fullName
    ? String(params.fullName)
    : 'Employer';

  const menuItems: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
  }[] = [
    {
      label: 'Post a Job',
      icon: 'add-circle-outline',
      route: '/employer/post-job',
    },
    {
      label: 'My Jobs',
      icon: 'briefcase-outline',
      route: '/employer/my-jobs',
    },
    {
      label: 'Find Workers',
      icon: 'search-outline',
      route: '/employer/find-workers',
    },
    {
      label: 'Applicants',
      icon: 'people-outline',
      route: '/employer/applicants',
    },
    {
      label: 'Job Requests',
      icon: 'paper-plane-outline',
      route: '/employer/job-requests',
    },
    {
      label: 'Reviews',
      icon: 'star-outline',
      route: '/employer/reviews',
    },
    {
      label: 'Job History',
      icon: 'time-outline',
      route: '/employer/job-history',
    },
    {
      label: 'Settings',
      icon: 'settings-outline',
      route: '/employer/settings',
    },
  ];

  const openEmployerPage = (route: string) => {
    router.push({
      pathname: route as any,
      params: {
        userId,
        fullName,
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
                {fullName}
              </Text>

              <Text style={styles.userRole}>
                EMPLOYER
              </Text>
            </View>
          </View>

          {/* NOTIFICATIONS */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() =>
              openEmployerPage('/employer/notifications')
            }
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
          onPress={() =>
            openEmployerPage('/employer/availability')
          }
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

        {/* EMPLOYER DASHBOARD CARD */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>
            EMPLOYER DASHBOARD
          </Text>

          <Text style={styles.todayHeadline}>
            Manage your jobs and connect with workers.
          </Text>

          <View style={styles.todayBadges}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                Employer
              </Text>
            </View>

            <View style={styles.pill}>
              <Text style={styles.pillText}>
                Tinabangay
              </Text>
            </View>
          </View>
        </View>

        {/* SERVICES */}
        <Text style={styles.sectionTitle}>
          EMPLOYER SERVICES
        </Text>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => openEmployerPage(item.route)}
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
   * Same top positioning as Worker Home.
   * This places the header below the camera/notch.
   */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 35,
  },

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
    color: NAVY,
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

  todayCard: {
    backgroundColor: NAVY,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },

  todayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAB1BC',
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
  },

  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  pillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A7F84',
    letterSpacing: 0.9,
    marginBottom: 12,
  },

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