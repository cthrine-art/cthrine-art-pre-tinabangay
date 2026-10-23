import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

type JobStatus =
  | 'Filled'
  | 'Closed'
  | 'Expired';

type HistoryJob = {
  id: number;
  title: string;
  worker: string;
  workerId?: number | null;
  service: string;
  location: string;
  budget: number;
  date: string;
  status: JobStatus;
  jobType?: string;
};

export default function JobHistoryScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const userId = String(
    params.userId || ''
  );

  const fullName = String(
    params.fullName || 'Employer'
  );

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<
    'All' | 'Filled' | 'Closed' | 'Expired'
  >('All');

  const [historyJobs, setHistoryJobs] =
    useState<HistoryJob[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadJobHistory = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/get-employer-job-history.php?employerId=${encodeURIComponent(
          userId
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load job history.'
        );
      }

      const jobs: HistoryJob[] =
        (data.jobs || []).map(
          (item: any) => ({
            id: Number(item.id),

            title:
              item.title ||
              'Untitled Job',

            worker:
              item.worker ||
              'No worker assigned',

            workerId:
              item.workerId !== null &&
              item.workerId !== undefined
                ? Number(item.workerId)
                : null,

            service:
              item.service ||
              'General Labor',

            location:
              item.location ||
              'Location not specified',

            budget:
              Number(item.budget) || 0,

            date:
              item.date ||
              '',

            status:
              item.status,

            jobType:
              item.jobType ||
              '',
          })
        );

      setHistoryJobs(jobs);
    } catch (error) {
      console.error(
        'Load job history error:',
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadJobHistory();
    }, [userId])
  );

  const filteredJobs = useMemo(() => {
    if (selectedFilter === 'All') {
      return historyJobs;
    }

    return historyJobs.filter(
      (job) =>
        job.status === selectedFilter
    );
  }, [
    historyJobs,
    selectedFilter,
  ]);

  const filledCount =
    historyJobs.filter(
      (job) => job.status === 'Filled'
    ).length;

  const closedCount =
    historyJobs.filter(
      (job) => job.status === 'Closed'
    ).length;

  const expiredCount =
    historyJobs.filter(
      (job) => job.status === 'Expired'
    ).length;

  const onRefresh = () => {
    setRefreshing(true);
    loadJobHistory();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FAF7F2"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={NAVY}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Job History
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {/* Title */}
        <Text style={styles.pageTitle}>
          Job History
        </Text>

        <Text style={styles.subtitle}>
          View your past job activities.
        </Text>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={styles.totalIcon}>
              <Ionicons
                name="briefcase-outline"
                size={18}
                color={NAVY}
              />
            </View>

            <Text style={styles.summaryNumber}>
              {historyJobs.length}
            </Text>

            <Text style={styles.summaryLabel}>
              Total Jobs
            </Text>
          </View>

          <View
            style={styles.summaryDivider}
          />

          <View style={styles.summaryItem}>
            <View
              style={styles.completedIcon}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={GREEN}
              />
            </View>

            <Text style={styles.summaryNumber}>
              {filledCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Filled
            </Text>
          </View>

          <View
            style={styles.summaryDivider}
          />

          <View style={styles.summaryItem}>
            <View
              style={styles.cancelledIcon}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color="#A34B4B"
              />
            </View>

            <Text style={styles.summaryNumber}>
              {closedCount +
                expiredCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Closed / Expired
            </Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterContainer
          }
        >
          {[
            'All',
            'Filled',
            'Closed',
            'Expired',
          ].map((filter) => {
            const active =
              selectedFilter === filter;

            return (
              <Pressable
                key={filter}
                style={[
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedFilter(
                    filter as
                      | 'All'
                      | 'Filled'
                      | 'Closed'
                      | 'Expired'
                  )
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section */}
        <View
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>
            Past Jobs
          </Text>

          <Text style={styles.countText}>
            {filteredJobs.length} job
            {filteredJobs.length !== 1
              ? 's'
              : ''}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator
              size="large"
              color={GREEN}
            />

            <Text style={styles.loadingText}>
              Loading job history...
            </Text>
          </View>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <HistoryCard
              key={job.id}
              job={job}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="file-tray-outline"
                size={31}
                color="#8A9197"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No job history
            </Text>

            <Text
              style={styles.emptyMessage}
            >
              There are no jobs under this
              category.
            </Text>
          </View>
        )}

        <Text style={styles.accountNote}>
          Signed in as {fullName}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type HistoryCardProps = {
  job: HistoryJob;
};

function HistoryCard({
  job,
}: HistoryCardProps) {
  return (
    <View style={styles.jobCard}>
      {/* Job Header */}
      <View style={styles.jobHeader}>
        <View style={styles.jobIcon}>
          <Ionicons
            name="briefcase-outline"
            size={20}
            color={NAVY}
          />
        </View>

        <View
          style={styles.jobHeaderInfo}
        >
          <Text style={styles.jobTitle}>
            {job.title}
          </Text>

          <Text style={styles.service}>
            {job.service}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            job.status === 'Filled' &&
              styles.filledBadge,
            job.status === 'Closed' &&
              styles.closedBadge,
            job.status === 'Expired' &&
              styles.expiredBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              job.status === 'Filled' &&
                styles.filledText,
              job.status === 'Closed' &&
                styles.closedText,
              job.status === 'Expired' &&
                styles.expiredText,
            ]}
          >
            {job.status}
          </Text>
        </View>
      </View>

      {/* Worker */}
      <View style={styles.workerRow}>
        <View style={styles.workerAvatar}>
          <Text
            style={styles.workerAvatarText}
          >
            {job.worker
              ? job.worker
                  .charAt(0)
                  .toUpperCase()
              : '?'}
          </Text>
        </View>

        <View style={styles.workerInfo}>
          <Text style={styles.workerLabel}>
            WORKER
          </Text>

          <Text style={styles.workerName}>
            {job.worker}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View
        style={styles.detailsContainer}
      >
        <View style={styles.detailItem}>
          <Ionicons
            name="location-outline"
            size={15}
            color="#68727A"
          />

          <View style={styles.detailText}>
            <Text
              style={styles.detailLabel}
            >
              Location
            </Text>

            <Text
              style={styles.detailValue}
            >
              {job.location}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons
            name="cash-outline"
            size={15}
            color="#68727A"
          />

          <View style={styles.detailText}>
            <Text
              style={styles.detailLabel}
            >
              Budget
            </Text>

            <Text
              style={styles.detailValue}
            >
              ₱
              {job.budget.toLocaleString(
                'en-PH',
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }
              )}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color="#68727A"
          />

          <View style={styles.detailText}>
            <Text
              style={styles.detailLabel}
            >
              Date
            </Text>

            <Text
              style={styles.detailValue}
            >
              {formatDate(job.date)}
            </Text>
          </View>
        </View>
      </View>

      {/* Job Type */}
      {job.jobType ? (
        <View style={styles.jobTypeRow}>
          <Ionicons
            name="repeat-outline"
            size={14}
            color={NAVY}
          />

          <Text
            style={styles.jobTypeText}
          >
            {job.jobType}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function formatDate(
  dateString: string
) {
  if (!dateString) {
    return 'Not specified';
  }

  const date = new Date(
    dateString.replace(' ', 'T')
  );

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    'en-PH',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 45,
  },

  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NAVY,
  },

  headerSpacer: {
    width: 40,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginTop: 8,
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 11,
    lineHeight: 17,
    color: '#7A8289',
    marginBottom: 18,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E5DF',
    marginBottom: 17,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  totalIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  completedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  cancelledIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8EAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  summaryNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },

  summaryLabel: {
    fontSize: 8,
    color: '#858C92',
    marginTop: 2,
    textAlign: 'center',
  },

  summaryDivider: {
    width: 1,
    height: 45,
    backgroundColor: '#E5E7E9',
  },

  filterContainer: {
    gap: 8,
    paddingBottom: 18,
  },

  filterButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE1E3',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filterButtonActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },

  filterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#68727A',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },

  countText: {
    fontSize: 9,
    color: '#858C92',
  },

  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  jobIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  jobHeaderInfo: {
    flex: 1,
  },

  jobTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },

  service: {
    fontSize: 9,
    color: '#858C92',
    marginTop: 3,
  },

  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  filledBadge: {
    backgroundColor: '#EAF5EC',
  },

  closedBadge: {
    backgroundColor: '#EEF1F5',
  },

  expiredBadge: {
    backgroundColor: '#F8EAEA',
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  filledText: {
    color: GREEN,
  },

  closedText: {
    color: NAVY,
  },

  expiredText: {
    color: '#A34B4B',
  },

  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F2',
  },

  workerAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  workerAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
  },

  workerInfo: {
    marginLeft: 9,
  },

  workerLabel: {
    fontSize: 7,
    color: '#9AA0A5',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  workerName: {
    fontSize: 10,
    fontWeight: '800',
    color: NAVY,
    marginTop: 2,
  },

  detailsContainer: {
    marginTop: 13,
    gap: 8,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F9',
    borderRadius: 9,
    padding: 9,
  },

  detailText: {
    marginLeft: 8,
  },

  detailLabel: {
    fontSize: 7,
    color: '#858C92',
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 9,
    fontWeight: '700',
    color: NAVY,
  },

  jobTypeRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F2',
    flexDirection: 'row',
    alignItems: 'center',
  },

  jobTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: NAVY,
    marginLeft: 5,
  },

  loadingState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 45,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  loadingText: {
    fontSize: 10,
    color: '#7A8289',
    marginTop: 10,
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 38,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F0F2F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 5,
  },

  emptyMessage: {
    fontSize: 10,
    color: '#7A8289',
    textAlign: 'center',
    lineHeight: 16,
  },

  accountNote: {
    textAlign: 'center',
    fontSize: 8,
    color: '#A0A6AB',
    marginTop: 15,
  },
});