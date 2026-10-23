import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
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

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

type JobStatus =
  | 'Open'
  | 'Filled'
  | 'Closed'
  | 'Expired';

type Job = {
  jobId: number;
  title: string;
  location: string;
  budget: number | null;
  jobType: string;
  status: JobStatus;
  createdAt: string;
  applicants: number;
};

export default function MyJobsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    userId?: string;
    fullName?: string;
  }>();

  const userId = params.userId
    ? String(params.userId)
    : '';

  const fullName = params.fullName
    ? String(params.fullName)
    : 'Employer';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingJobId, setCompletingJobId] =
    useState<number | null>(null);

  /*
   * LOAD EMPLOYER JOBS
   */
  const loadJobs = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/get-employer-jobs.php?employerId=${encodeURIComponent(
          userId
        )}`
      );

      const responseText = await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The server returned an invalid response:\n\n${responseText}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Failed to load your jobs.'
        );
      }

      /*
       * Accept the normal response:
       *
       * {
       *   success: true,
       *   jobs: [...]
       * }
       */
      const receivedJobs = Array.isArray(data.jobs)
        ? data.jobs
        : [];

      const formattedJobs: Job[] =
        receivedJobs.map((item: any) => ({
          jobId: Number(
            item.jobId ??
              item.job_id ??
              item.id
          ),

          title:
            item.title ??
            item.jobTitle ??
            'Untitled Job',

          location:
            item.location ??
            'Location not specified',

          budget:
            item.budget !== null &&
            item.budget !== undefined
              ? Number(item.budget)
              : null,

          jobType:
            item.jobType ??
            item.job_type ??
            'One-time',

          status:
            item.status ?? 'Open',

          createdAt:
            item.createdAt ??
            item.created_at ??
            '',

          applicants:
            Number(
              item.applicants ??
                item.applicantCount ??
                item.applicant_count ??
                0
            ),
        }));

      setJobs(formattedJobs);
    } catch (error: any) {
      console.error(
        'GET EMPLOYER JOBS ERROR:',
        error
      );

      Alert.alert(
        'Unable to Load Jobs',
        error?.message ||
          'Something went wrong while loading your jobs.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  /*
   * RELOAD WHEN SCREEN OPENS
   */
  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  /*
   * REFRESH
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  /*
   * CONFIRM JOB COMPLETION
   */
  const confirmJobCompletion = (
    job: Job
  ) => {
    Alert.alert(
      'Confirm Job Completion',
      `Has the worker successfully completed "${job.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Completed',
          onPress: () => {
            completeJob(job);
          },
        },
      ]
    );
  };

  /*
   * CALL confirm-job-completion.php
   */
  const completeJob = async (
    job: Job
  ) => {
    if (!userId || !job.jobId) {
      Alert.alert(
        'Error',
        'Missing employer or job information.'
      );
      return;
    }

    try {
      setCompletingJobId(job.jobId);

      const response = await fetch(
        `${API_BASE_URL}/confirm-job-completion.php`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            employerId: Number(userId),
            jobId: Number(job.jobId),
          }),
        }
      );

      const responseText =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The server returned an invalid response:\n\n${responseText}`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
            'Unable to confirm job completion.'
        );
      }

      /*
       * Update the job immediately on the screen.
       */
      setJobs((currentJobs) =>
        currentJobs.map((item) =>
          item.jobId === job.jobId
            ? {
                ...item,
                status: 'Closed',
              }
            : item
        )
      );

      Alert.alert(
        'Job Completed',
        'The job has been marked as completed successfully.',
        [
          {
            text: 'OK',
          },
        ]
      );
    } catch (error: any) {
      console.error(
        'CONFIRM JOB COMPLETION ERROR:',
        error
      );

      Alert.alert(
        'Unable to Confirm',
        error?.message ||
          'Something went wrong while confirming the job completion.'
      );
    } finally {
      setCompletingJobId(null);
    }
  };

  /*
   * OPEN JOB APPLICATIONS
   */
  const openApplicants = (
    job: Job
  ) => {
    router.push({
      pathname:
        '/employer/applicants',

      params: {
        userId,
        fullName,
        jobId: String(job.jobId),
        jobTitle: job.title,
      },
    });
  };

  /*
   * FORMAT BUDGET
   */
  const formatBudget = (
    budget: number | null
  ) => {
    if (
      budget === null ||
      budget === undefined
    ) {
      return 'Not specified';
    }

    return `₱${Number(budget).toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  /*
   * FORMAT DATE
   */
  const formatDate = (
    value: string
  ) => {
    if (!value) {
      return 'Not specified';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  /*
   * STATUS LABEL
   */
  const getStatusLabel = (status: JobStatus) => {
  switch (status) {
    case 'Open':
      return 'OPEN';
    case 'Filled':
      return 'IN PROGRESS';
    case 'Closed':
      return 'COMPLETED';
    case 'Expired':
      return 'EXPIRED';
  }
};

  /*
   * STATUS STYLE
   */
  const getStatusStyle = (
    status: JobStatus
  ) => {
    switch (status) {
      case 'Open':
        return styles.openBadge;

      case 'Filled':
        return styles.filledBadge;

      case 'Closed':
        return styles.closedBadge;

      case 'Expired':
        return styles.expiredBadge;

      default:
        return styles.openBadge;
    }
  };

  const getStatusTextStyle = (
    status: JobStatus
  ) => {
    switch (status) {
      case 'Open':
        return styles.openText;

      case 'Filled':
        return styles.filledText;

      case 'Closed':
        return styles.closedText;

      case 'Expired':
        return styles.expiredText;

      default:
        return styles.openText;
    }
  };

  /*
   * FILTER JOBS
   *
   * Filled = worker has been accepted
   * Closed = employer confirmed completion
   */
  const activeJobs = jobs.filter(
    (job) =>
      job.status === 'Open' ||
      job.status === 'Filled'
  );

  const completedJobs = jobs.filter(
    (job) =>
      job.status === 'Closed'
  );

  /*
   * LOADING
   */
  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F5FFF9"
        />

        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color={GREEN}
          />

          <Text
            style={styles.loadingText}
          >
            Loading your jobs...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * MAIN SCREEN
   */
  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5FFF9"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={NAVY}
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            My Jobs
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={() =>
              router.push({
                pathname:
                  '/employer/post-job',
                params: {
                  userId,
                  fullName,
                },
              })
            }
          >
            <Ionicons
              name="add"
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* SUMMARY */}
        <View
          style={styles.summaryCard}
        >
          <View
            style={styles.summaryItem}
          >
            <Text
              style={styles.summaryLabel}
            >
              ACTIVE JOBS
            </Text>

            <Text
              style={styles.summaryNumber}
            >
              {activeJobs.length}
            </Text>
          </View>

          <View
            style={styles.summaryDivider}
          />

          <View
            style={styles.summaryItem}
          >
            <Text
              style={styles.summaryLabel}
            >
              COMPLETED
            </Text>

            <Text
              style={styles.summaryNumber}
            >
              {completedJobs.length}
            </Text>
          </View>
        </View>

        {/* ACTIVE JOBS */}
        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Active Jobs
          </Text>

          <Text
            style={styles.sectionCount}
          >
            {activeJobs.length} job
            {activeJobs.length !== 1
              ? 's'
              : ''}
          </Text>
        </View>

        {activeJobs.length > 0 ? (
          activeJobs.map((job) => (
            <JobCard
              key={job.jobId}
              job={job}
              onApplicants={() =>
                openApplicants(job)
              }
              onComplete={() =>
                confirmJobCompletion(
                  job
                )
              }
              completing={
                completingJobId ===
                job.jobId
              }
            />
          ))
        ) : (
          <EmptyState
            icon="briefcase-outline"
            title="No active jobs"
            message="Your current job postings will appear here."
          />
        )}

        {/* COMPLETED JOBS */}
        <View
          style={
            styles.completedSectionHeader
          }
        >
          <Text
            style={styles.sectionTitle}
          >
            Completed Jobs
          </Text>

          <Text
            style={styles.sectionCount}
          >
            {completedJobs.length} job
            {completedJobs.length !== 1
              ? 's'
              : ''}
          </Text>
        </View>

        {completedJobs.length > 0 ? (
          completedJobs.map((job) => (
            <JobCard
              key={job.jobId}
              job={job}
              completed
              onApplicants={() =>
                openApplicants(job)
              }
              onComplete={() => {}}
              completing={false}
            />
          ))
        ) : (
          <EmptyState
            icon="checkmark-circle-outline"
            title="No completed jobs"
            message="Jobs you confirm as completed will appear here."
          />
        )}

        {/* POST NEW JOB */}
        <Pressable
          style={({ pressed }) => [
            styles.postButton,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() =>
            router.push({
              pathname:
                '/employer/post-job',
              params: {
                userId,
                fullName,
              },
            })
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={19}
            color="#FFFFFF"
          />

          <Text
            style={styles.postButtonText}
          >
            Post a New Job
          </Text>
        </Pressable>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * JOB CARD
 */

type JobCardProps = {
  job: Job;
  completed?: boolean;
  onApplicants: () => void;
  onComplete: () => void;
  completing: boolean;
};

function JobCard({
  job,
  completed = false,
  onApplicants,
  onComplete,
  completing,
}: JobCardProps) {
  return (
    <View style={styles.jobCard}>
      {/* TOP ROW */}
      <View
        style={styles.jobCardTop}
      >
        <View
          style={styles.jobIcon}
        >
          <Ionicons
            name="briefcase-outline"
            size={22}
            color={GREEN}
          />
        </View>

        <View
          style={styles.jobMain}
        >
          <Text
            style={styles.jobTitle}
            numberOfLines={2}
          >
            {job.title}
          </Text>

          <View
            style={[
              styles.statusBadge,
              getStatusStyleStatic(
                job.status
              ),
            ]}
          >
            <Text
              style={[
                styles.statusText,
                getStatusTextStyleStatic(
                  job.status
                ),
              ]}
            >
              {getStatusLabelStatic(
                job.status
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* LOCATION */}
      <View
        style={styles.infoRow}
      >
        <Ionicons
          name="location-outline"
          size={17}
          color="#737B80"
        />

        <Text
          style={styles.infoText}
          numberOfLines={2}
        >
          {job.location}
        </Text>
      </View>

      {/* BUDGET */}
      <View
        style={styles.infoRow}
      >
        <Ionicons
          name="cash-outline"
          size={17}
          color="#737B80"
        />

        <Text
          style={styles.infoText}
        >
          {formatBudgetStatic(
            job.budget
          )}
        </Text>
      </View>

      {/* JOB TYPE */}
      <View
        style={styles.infoRow}
      >
        <Ionicons
          name="calendar-outline"
          size={17}
          color="#737B80"
        />

        <Text
          style={styles.infoText}
        >
          {job.jobType}
        </Text>
      </View>

      {/* DATE */}
      <View
        style={styles.infoRow}
      >
        <Ionicons
          name="time-outline"
          size={17}
          color="#737B80"
        />

        <Text
          style={styles.infoText}
        >
          Posted {formatDateStatic(
            job.createdAt
          )}
        </Text>
      </View>

      {/* APPLICANTS */}
      <View
        style={styles.applicantRow}
      >
        <Ionicons
          name="people-outline"
          size={17}
          color={GREEN}
        />

        <Text
          style={styles.applicantText}
        >
          {job.applicants}{' '}
          applicant
          {job.applicants !== 1
            ? 's'
            : ''}
        </Text>
      </View>

      {/* ACTIONS */}
      <View
        style={styles.actionArea}
      >
        {/* VIEW APPLICATIONS */}
        {(job.status === 'Open' ||
          job.status === 'Filled') && (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={onApplicants}
          >
            <Ionicons
              name="people-outline"
              size={17}
              color={NAVY}
            />

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              View Applicants
            </Text>
          </Pressable>
        )}

        {/* CONFIRM COMPLETION */}
        {job.status === 'Filled' &&
          !completed && (
            <Pressable
              style={({ pressed }) => [
                styles.completeButton,
                pressed &&
                  styles.buttonPressed,
                completing &&
                  styles.disabledButton,
              ]}
              onPress={onComplete}
              disabled={completing}
            >
              {completing ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />
              )}

              <Text
                style={
                  styles.completeButtonText
                }
              >
                {completing
                  ? 'Confirming...'
                  : 'Confirm Job Completion'}
              </Text>
            </Pressable>
          )}

        {/* COMPLETED LABEL */}
        {job.status === 'Closed' && (
          <View
            style={styles.completedMessage}
          >
            <Ionicons
              name="checkmark-circle"
              size={19}
              color={GREEN}
            />

            <Text
              style={
                styles.completedMessageText
              }
            >
              Job completed
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/*
 * EMPTY STATE
 */

type EmptyStateProps = {
  icon: any;
  title: string;
  message: string;
};

function EmptyState({
  icon,
  title,
  message,
}: EmptyStateProps) {
  return (
    <View
      style={styles.emptyCard}
    >
      <Ionicons
        name={icon}
        size={42}
        color="#A5ADA9"
      />

      <Text
        style={styles.emptyTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.emptyMessage}
      >
        {message}
      </Text>
    </View>
  );
}

/*
 * STATIC HELPERS
 */

const NAVY = '#17324D';
const GREEN = '#5E9F68';

function formatBudgetStatic(
  amount: number | null
) {
  if (
    amount === null ||
    amount === undefined
  ) {
    return 'Not specified';
  }

  return `₱${Number(amount).toLocaleString(
    'en-PH',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDateStatic(
  value: string
) {
  if (!value) {
    return 'Not specified';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    'en-PH',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );
}

function getStatusLabelStatic(status: JobStatus) {
  switch (status) {
    case 'Open':
      return 'OPEN';
    case 'Filled':
      return 'IN PROGRESS';
    case 'Closed':
      return 'COMPLETED';
    case 'Expired':
      return 'EXPIRED';
  }
}

function getStatusStyleStatic(
  status: JobStatus
) {
  switch (status) {
    case 'Open':
      return styles.openBadge;

    case 'Filled':
      return styles.filledBadge;

    case 'Closed':
      return styles.closedBadge;

    case 'Expired':
      return styles.expiredBadge;

    default:
      return styles.openBadge;
  }
}

function getStatusTextStyleStatic(
  status: JobStatus
) {
  switch (status) {
    case 'Open':
      return styles.openText;

    case 'Filled':
      return styles.filledText;

    case 'Closed':
      return styles.closedText;

    case 'Expired':
      return styles.expiredText;

    default:
      return styles.openText;
  }
}

/*
 * STYLES
 */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5FFF9',
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E4ECE6',
    marginBottom: 26,
  },

  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78827C',
    letterSpacing: 0.7,
  },

  summaryNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: NAVY,
    marginTop: 5,
  },

  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#E1E6E3',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  completedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
  },

  sectionCount: {
    fontSize: 12,
    color: '#78827C',
    fontWeight: '600',
  },

  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E4ECE6',
  },

  jobCardTop: {
    flexDirection: 'row',
    marginBottom: 15,
  },

  jobIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  jobMain: {
    flex: 1,
  },

  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 7,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  openBadge: {
    backgroundColor: '#EEF8EF',
  },

  openText: {
    color: '#4D8A57',
  },

  filledBadge: {
    backgroundColor: '#FFF4DF',
  },

  filledText: {
    color: '#A46D18',
  },

  closedBadge: {
    backgroundColor: '#E8F6ED',
  },

  closedText: {
    color: '#438452',
  },

  expiredBadge: {
    backgroundColor: '#F3F3F3',
  },

  expiredText: {
    color: '#777777',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#5F686D',
    marginLeft: 9,
    lineHeight: 18,
  },

  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 15,
  },

  applicantText: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 8,
  },

  actionArea: {
    borderTopWidth: 1,
    borderTopColor: '#EDF0EE',
    paddingTop: 14,
  },

  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E0DA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
    paddingHorizontal: 12,
  },

  secondaryButtonText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 7,
  },

  completeButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 7,
  },

  disabledButton: {
    opacity: 0.65,
  },

  completedMessage: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#EAF5EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedMessageText: {
    color: '#438452',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 7,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E4ECE6',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginTop: 10,
  },

  emptyMessage: {
    fontSize: 12,
    color: '#7A8380',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },

  postButton: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5FFF9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6E7773',
  },

  bottomSpace: {
    height: 20,
  },
});