import React, { useCallback, useEffect, useState } from 'react';

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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  price: string;
  budget: string | number | null;
  jobType: string | null;
  status: 'OPEN' | 'CLOSED' | string;
  tags: string[];
  createdAt: string;
  expiresAt: string | null;
};

export default function BrowseJobsScreen() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId?: string;
  }>();

  const [fullName, setFullName] = useState('');
  const [search, setSearch] = useState('');

  const [jobs, setJobs] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');


  /*
   * =========================
   * GET PROFILE
   * =========================
   */

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/get-profile.php?userId=${userId}`
      );

      const data = await response.json();

      if (response.ok) {
        setFullName(data.fullName || '');
      }
    } catch (err) {
      console.log('Profile fetch error:', err);
    }
  }, [userId]);


  /*
   * =========================
   * GET REAL JOBS
   * =========================
   */

  const fetchJobs = useCallback(async () => {
    try {
      setErrorMessage('');

      const response = await fetch(
        `${API_BASE_URL}/get-jobs.php`
      );

      const data = await response.json();

      console.log('GET JOBS RESPONSE:', data);

      if (!response.ok) {
        setErrorMessage(
          data.error || 'Failed to load job postings.'
        );
        return;
      }

      setJobs(data.jobs || []);

    } catch (err) {
      console.log('Jobs fetch error:', err);

      setErrorMessage(
        'Could not reach the server. Please check your connection.'
      );
    }
  }, []);


  /*
   * =========================
   * INITIAL LOAD
   * =========================
   */

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchProfile(),
        fetchJobs(),
      ]);

      setLoading(false);
    };

    loadData();
  }, [fetchProfile, fetchJobs]);


  /*
   * =========================
   * REFRESH
   * =========================
   */

  const onRefresh = async () => {
    setRefreshing(true);

    await Promise.all([
      fetchProfile(),
      fetchJobs(),
    ]);

    setRefreshing(false);
  };


  /*
   * =========================
   * SEARCH
   * =========================
   */

  const filteredJobs = jobs.filter((job) => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return true;
    }

    return (
      job.title.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q) ||
      (job.description || '').toLowerCase().includes(q) ||
      (job.jobType || '').toLowerCase().includes(q) ||
      job.tags.join(' ').toLowerCase().includes(q)
    );
  });


  /*
   * =========================
   * LOADING
   * =========================
   */

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={GREEN}
          />

          <Text style={styles.loadingText}>
            Loading job postings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >

        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={NAVY}
            />
          </TouchableOpacity>


          <View style={styles.headerCenter}>

            <Image
              source={require('../../../assets/tinabangay-logo.png')}
              style={styles.avatar}
              resizeMode="contain"
            />

            <View style={styles.profileInfo}>

              <Text
                style={styles.userName}
                numberOfLines={1}
              >
                {fullName || 'Worker'}
              </Text>

              <Text style={styles.userRole}>
                JOB SEEKERS
              </Text>

            </View>

          </View>


          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/worker/worker-alert',
                params: {
                  userId,
                },
              } as any)
            }
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={GREEN}
            />
          </TouchableOpacity>

        </View>


        {/* =========================
            TITLE
        ========================= */}

        <Text style={styles.pageTitle}>
          Browse job postings
        </Text>


        {/* =========================
            SEARCH
        ========================= */}

        <View style={styles.searchWrap}>

          <Ionicons
            name="search-outline"
            size={17}
            color="#9CA3AF"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, skills"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />

        </View>


        {/* =========================
            ERROR
        ========================= */}

        {errorMessage ? (
          <View style={styles.errorBox}>

            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#DC2626"
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>

          </View>
        ) : null}


        {/* =========================
            NO JOBS
        ========================= */}

        {!errorMessage && filteredJobs.length === 0 ? (
          <View style={styles.emptyBox}>

            <Ionicons
              name="briefcase-outline"
              size={40}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTitle}>
              No job postings available
            </Text>

            <Text style={styles.emptyText}>
              There are currently no open jobs matching your search.
            </Text>

          </View>
        ) : null}


        {/* =========================
            REAL DATABASE JOBS
        ========================= */}

        {filteredJobs.map((job) => (

          <TouchableOpacity
            key={job.id}
            style={styles.jobCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: 'worker/job-details',
                params: {
                  jobId: job.id,
                  userId,
                },
              } as any)
            }
          >

            <View style={styles.jobCardTop}>

              <Text
                style={styles.jobTitle}
                numberOfLines={2}
              >
                {job.title}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  job.status === 'OPEN'
                    ? styles.statusOpen
                    : styles.statusClosed,
                ]}
              >

                <Text
                  style={[
                    styles.statusBadgeText,
                    job.status === 'OPEN'
                      ? styles.statusTextOpen
                      : styles.statusTextClosed,
                  ]}
                >
                  {job.status}
                </Text>

              </View>

            </View>


            {/* LOCATION + PRICE */}

            <Text style={styles.jobMeta}>
              {job.location} · {job.price}
            </Text>


            {/* TAGS */}

            {job.tags.length > 0 ? (
              <View style={styles.tagRow}>

                {job.tags.map((tag) => (

                  <View
                    key={tag}
                    style={styles.tagPill}
                  >

                    <Text style={styles.tagText}>
                      {tag}
                    </Text>

                  </View>

                ))}

              </View>
            ) : null}

          </TouchableOpacity>

        ))}

      </ScrollView>

    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  /*
   * MAIN
   */

  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 40,
  },


  /*
   * LOADING
   */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B7280',
  },


  /*
   * HEADER
   */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  backButton: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 2,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 2,
  },

  userRole: {
    fontSize: 10,
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
    marginLeft: 8,
  },


  /*
   * TITLE
   */

  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 18,
  },


  /*
   * SEARCH
   */

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 14,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: NAVY,
    padding: 0,
    marginLeft: 8,
  },


  /*
   * ERROR
   */

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },

  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
  },


  /*
   * EMPTY
   */

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 70,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
    marginTop: 10,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },


  /*
   * JOB CARD
   */

  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 12,
  },

  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
    flex: 1,
    marginRight: 8,
  },


  /*
   * STATUS
   */

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusOpen: {
    backgroundColor: '#EAF6EC',
  },

  statusClosed: {
    backgroundColor: '#F3F4F6',
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  statusTextOpen: {
    color: GREEN,
  },

  statusTextClosed: {
    color: '#6B7280',
  },


  /*
   * JOB INFO
   */

  jobMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 11,
  },


  /*
   * TAGS
   */

  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },

  tagPill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },

});