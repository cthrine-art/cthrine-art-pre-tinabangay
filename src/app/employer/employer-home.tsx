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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EmployerHomeScreen() {
  const router = useRouter();

  const menuItems: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
  }[] = [
    { label: 'Post a Job', icon: 'add-circle-outline', route: '/post-job' },
    { label: 'My Jobs', icon: 'briefcase-outline', route: '/my-jobs' },
    { label: 'Applicants', icon: 'people-outline', route: '/applicants' },
    { label: 'Profile', icon: 'person-outline', route: '/profile' },
    { label: 'Alerts', icon: 'notifications-outline', route: '/alerts' },
    { label: 'Settings', icon: 'settings-outline', route: '/settings' },
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
              <Text style={styles.userName}>Maria Santos</Text>
              <Text style={styles.userRole}>EMPLOYER</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push('/alerts' as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>TODAY</Text>
          <Text style={styles.todayHeadline}>2 job posts have new applicants</Text>
          <View style={styles.todayBadges}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Active</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Verified</Text>
            </View>
          </View>
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
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    gap: 14,
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