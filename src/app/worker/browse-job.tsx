import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

type Job = {
  id: string;
  title: string;
  location: string;
  price: string;
  status: 'OPEN' | 'CLOSED';
  tags: string[];
};

// TODO: replace with a real fetch to get-jobs.php once the `jobs` table
// schema is confirmed. Sample data below matches the mockup for now.
const SAMPLE_JOBS: Job[] = [
  {
    id: '1',
    title: 'Carpentry helper',
    location: 'Brgy. Lahug',
    price: '₱500/day',
    status: 'OPEN',
    tags: ['FULL-DAY', 'ONSITE'],
  },
  {
    id: '2',
    title: 'House cleaning',
    location: 'Brgy. Lahug',
    price: '₱650/day',
    status: 'OPEN',
    tags: ['FULL-DAY', 'ONSITE'],
  },
  {
    id: '3',
    title: 'Delivery rider',
    location: 'Brgy. Lahug',
    price: '₱800/day',
    status: 'OPEN',
    tags: ['FULL-DAY', 'ONSITE'],
  },
];

export default function BrowseJobsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [fullName, setFullName] = useState('');
  const [search, setSearch] = useState('');
  const [jobs] = useState<Job[]>(SAMPLE_JOBS);

  useEffect(() => {
    if (!userId) return;
    const fetchName = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-profile.php?userId=${userId}`);
        const data = await response.json();
        if (response.ok) {
          setFullName(data.fullName || '');
        }
      } catch (err) {
        console.log('Header profile fetch error:', err);
      }
    };
    fetchName();
  }, [userId]);

  const filteredJobs = jobs.filter((job) => {
    const q = search.trim().toLowerCase();
    return !q || job.title.toLowerCase().includes(q) || job.tags.join(' ').toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={NAVY} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Image
              source={require('../../../assets/tinabangay-logo.png')}
              style={styles.avatar}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.userName}>{fullName || 'Worker'}</Text>
              <Text style={styles.userRole}>INFORMAL WORKER</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push({ pathname: '/worker/worker-alert', params: { userId } } as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Browse job postings</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, skills"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="briefcase-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyText}>No jobs match your search.</Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => router.push({ pathname: '/job-details', params: { jobId: job.id } } as any)}
            >
              <View style={styles.jobCardTop}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    job.status === 'OPEN' ? styles.statusOpen : styles.statusClosed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      job.status === 'OPEN' ? styles.statusTextOpen : styles.statusTextClosed,
                    ]}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.jobMeta}>
                {job.location} · {job.price}
              </Text>

              <View style={styles.tagRow}>
                {job.tags.map((tag) => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'flex-start' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginLeft: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF' },
  userName: { fontSize: 14, fontWeight: '700', color: NAVY },
  userRole: { fontSize: 10, fontWeight: '700', color: GREEN, letterSpacing: 0.5 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 13, color: NAVY, padding: 0 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 13, color: '#9CA3AF' },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  jobTitle: { fontSize: 15, fontWeight: '700', color: NAVY, flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusOpen: { backgroundColor: '#EAF6EC' },
  statusClosed: { backgroundColor: '#F3F4F6' },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusTextOpen: { color: GREEN },
  statusTextClosed: { color: '#6B7280' },
  jobMeta: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tagPill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
});