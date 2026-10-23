import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

// ======================================================
// API
// ======================================================

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

// ======================================================
// TYPES
// ======================================================

type JobDetails = {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude?: string | number | null;
  longitude?: string | number | null;

  price?: string | number | null;
  budget?: string | number | null;

  jobType?: string | null;
  schedule?: string | null;

  categoryId?: string | number | null;
  categoryName?: string | null;

  requiredSkills?: string | null;

  status: string;
  createdAt?: string | null;
  expiresAt?: string | null;

  employerId?: string | number | null;
  employerName?: string | null;
};

// ======================================================
// SCREEN
// ======================================================

export default function JobDetailsScreen() {
  const router = useRouter();

  // ----------------------------------------------------
  // PARAMETERS
  // ----------------------------------------------------

  const params = useLocalSearchParams<{
    jobId?: string;
    userId?: string;
  }>();

  const jobId = params.jobId ? String(params.jobId) : '';
  const userId = params.userId ? String(params.userId) : '';

  // ----------------------------------------------------
  // STATE
  // ----------------------------------------------------

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // ====================================================
  // LOAD JOB DETAILS
  // ====================================================

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    if (!jobId) {
      setLoading(false);

      Alert.alert(
        'Missing Job',
        'The selected job could not be found.',
        [
          {
            text: 'Go Back',
            onPress: () => router.back(),
          },
        ]
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/get-job-details.php?jobId=${encodeURIComponent(
          jobId
        )}`
      );

      const responseText = await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The server returned an invalid response.\n\n${responseText}`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Unable to load job details.'
        );
      }

      setJob(data.job);
    } catch (error: any) {
      console.error('LOAD JOB DETAILS ERROR:', error);

      Alert.alert(
        'Unable to Load Job',
        error?.message ||
          'Something went wrong while loading the job.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // APPLY
  // ====================================================

  const handleApply = () => {
    if (!job) {
      return;
    }

    if (!userId) {
      Alert.alert(
        'Missing Worker Information',
        'Your worker account could not be identified. Please return to the dashboard and try again.'
      );
      return;
    }

    if (job.status.toUpperCase() !== 'OPEN') {
      Alert.alert(
        'Job Unavailable',
        'This job is no longer accepting applications.'
      );
      return;
    }

    Alert.alert(
      'Apply for this Job?',
      `You are applying for "${job.title}".\n\nYour worker profile will be sent to the employer for review.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Apply',
          onPress: submitApplication,
        },
      ]
    );
  };

  // ====================================================
  // SUBMIT APPLICATION
  // ====================================================

  const submitApplication = async () => {
    if (!job || applying) {
      return;
    }

    try {
      setApplying(true);

      const response = await fetch(
        `${API_BASE_URL}/apply-job.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId,
            userId,
          }),
        }
      );

      const responseText = await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The server returned an invalid response.\n\n${responseText}`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'Unable to submit your application.'
        );
      }

      Alert.alert(
        'Application Submitted!',
        'Your application has been sent to the employer. You can track your application status from your Applications page.',
        [
          {
            text: 'Done',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('APPLY JOB ERROR:', error);

      Alert.alert(
        'Unable to Apply',
        error?.message ||
          'Something went wrong while submitting your application.'
      );
    } finally {
      setApplying(false);
    }
  };

  // ====================================================
  // BACK
  // ====================================================

  const handleBack = () => {
    if (applying) {
      return;
    }

    router.back();
  };

  // ====================================================
  // HELPERS
  // ====================================================

  const formatBudget = () => {
    if (!job) {
      return 'Not specified';
    }

    const value = job.budget ?? job.price;

    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ''
    ) {
      return 'Not specified';
    }

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return `₱${numericValue.toLocaleString(
        'en-PH'
      )}`;
    }

    return `₱${String(value)}`;
  };

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) {
      return 'Not specified';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSkills = () => {
    if (!job?.requiredSkills) {
      return [];
    }

    return String(job.requiredSkills)
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F5FFF9"
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#178A55"
          />

          <Text style={styles.loadingText}>
            Loading job details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ====================================================
  // NO JOB
  // ====================================================

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F5FFF9"
        />

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>!</Text>
          </View>

          <Text style={styles.emptyTitle}>
            Job Not Found
          </Text>

          <Text style={styles.emptySubtitle}>
            This job may have been removed or is no
            longer available.
          </Text>

          <Pressable
            style={styles.backToJobsButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToJobsText}>
              Back to Jobs
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isOpen =
    job.status.toUpperCase() === 'OPEN';

  const skills = getSkills();

  // ====================================================
  // UI
  // ====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5FFF9"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            HEADER
        ============================================ */}

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              Job Details
            </Text>

            <Text style={styles.headerSubtitle}>
              Review the job before applying
            </Text>
          </View>
        </View>

        {/* ============================================
            JOB SUMMARY
        ============================================ */}

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleContainer}>
              <Text style={styles.jobTitle}>
                {job.title}
              </Text>

              {job.categoryName ? (
                <Text style={styles.categoryText}>
                  {job.categoryName}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.statusBadge,
                isOpen
                  ? styles.statusOpen
                  : styles.statusClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isOpen
                    ? styles.statusTextOpen
                    : styles.statusTextClosed,
                ]}
              >
                {job.status}
              </Text>
            </View>
          </View>

          {/* Budget */}

          <View style={styles.budgetBox}>
            <Text style={styles.budgetLabel}>
              Budget
            </Text>

            <Text style={styles.budgetValue}>
              {formatBudget()}
            </Text>
          </View>

          {/* Location */}

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Text style={styles.infoIcon}>
                ⌖
              </Text>
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Location
              </Text>

              <Text style={styles.infoValue}>
                {job.location ||
                  'Location not specified'}
              </Text>
            </View>
          </View>

          {/* Job Type */}

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Text style={styles.infoIcon}>
                ◷
              </Text>
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Job Type
              </Text>

              <Text style={styles.infoValue}>
                {job.jobType ||
                  'Not specified'}
              </Text>
            </View>
          </View>

          {/* Schedule */}

          {job.schedule ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>
                  ▣
                </Text>
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Schedule
                </Text>

                <Text style={styles.infoValue}>
                  {job.schedule}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ============================================
            DESCRIPTION
        ============================================ */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Job Description
          </Text>

          <Text style={styles.description}>
            {job.description ||
              'No description was provided for this job.'}
          </Text>
        </View>

        {/* ============================================
            REQUIRED SKILLS
        ============================================ */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Required Skills
          </Text>

          {skills.length > 0 ? (
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <View
                  key={`${skill}-${index}`}
                  style={styles.skillTag}
                >
                  <Text style={styles.skillTagText}>
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.mutedText}>
              No specific skills were listed.
            </Text>
          )}
        </View>

        {/* ============================================
            EMPLOYER
        ============================================ */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Posted By
          </Text>

          <View style={styles.employerRow}>
            <View style={styles.employerAvatar}>
              <Text style={styles.employerAvatarText}>
                {(job.employerName ||
                  'E')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View style={styles.employerInfo}>
              <Text style={styles.employerName}>
                {job.employerName ||
                  'Employer'}
              </Text>

              <Text style={styles.employerRole}>
                Employer
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================
            POST INFORMATION
        ============================================ */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Job Information
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Posted
            </Text>

            <Text style={styles.detailValue}>
              {formatDate(job.createdAt)}
            </Text>
          </View>

          {job.expiresAt ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Application Deadline
              </Text>

              <Text style={styles.detailValue}>
                {formatDate(job.expiresAt)}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Status
            </Text>

            <Text
              style={[
                styles.detailValue,
                isOpen
                  ? styles.openDetail
                  : styles.closedDetail,
              ]}
            >
              {job.status}
            </Text>
          </View>
        </View>



        <View style={styles.applySection}>
          {isOpen ? (
            <>
              <Text style={styles.applyHint}>
                Interested in this job? Submit your
                application to the employer.
              </Text>

              <Pressable
                style={[
                  styles.applyButton,
                  applying &&
                    styles.applyButtonDisabled,
                ]}
                onPress={handleApply}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text
                      style={styles.applyButtonText}
                    >
                      Apply for this Job
                    </Text>

                    <Text
                      style={styles.applyArrow}
                    >
                      →
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <View style={styles.closedBox}>
              <Text style={styles.closedTitle}>
                This job is no longer available
              </Text>

              <Text style={styles.closedSubtitle}>
                Applications are currently closed
                for this job.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5FFF9',
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 35,
  },


  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5F7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  backIcon: {
    fontSize: 32,
    color: '#176B45',
    lineHeight: 34,
    marginTop: -3,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#123B2A',
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#728078',
  },

 
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEFE5',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  heroTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },

  jobTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#123B2A',
  },

  categoryText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '600',
    color: '#718078',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  statusOpen: {
    backgroundColor: '#E2F6EB',
  },

  statusClosed: {
    backgroundColor: '#F1F3F2',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  statusTextOpen: {
    color: '#178A55',
  },

  statusTextClosed: {
    color: '#77817C',
  },


  budgetBox: {
    backgroundColor: '#F1FBF5',
    borderWidth: 1,
    borderColor: '#D7EEE0',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 14,
  },

  budgetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718078',
    marginBottom: 2,
  },

  budgetValue: {
    fontSize: 21,
    fontWeight: '800',
    color: '#178A55',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },

  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF7F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoIcon: {
    fontSize: 16,
    color: '#178A55',
    fontWeight: '800',
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A8880',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#263F33',
    lineHeight: 18,
  },



  card: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEFE5',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#234838',
    marginBottom: 11,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#52635A',
  },

  mutedText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7D8A83',
  },


  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  skillTag: {
    backgroundColor: '#EAF7F0',
    borderWidth: 1,
    borderColor: '#CDE8D8',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  skillTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#24704C',
  },



  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  employerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DDF3E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  employerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#178A55',
  },

  employerInfo: {
    flex: 1,
  },

  employerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#263F33',
  },

  employerRole: {
    marginTop: 3,
    fontSize: 12,
    color: '#7A8880',
  },


  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF5F1',
  },

  detailLabel: {
    flex: 1,
    fontSize: 12,
    color: '#718078',
  },

  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: '#33483D',
  },

  openDetail: {
    color: '#178A55',
  },

  closedDetail: {
    color: '#7A8580',
  },


  applySection: {
    marginHorizontal: 20,
    marginTop: 3,
  },

  applyHint: {
    fontSize: 12,
    lineHeight: 18,
    color: '#718078',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 15,
  },

  applyButton: {
    minHeight: 55,
    borderRadius: 14,
    backgroundColor: '#178A55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyButtonDisabled: {
    opacity: 0.6,
  },

  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  applyArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 9,
  },

  closedBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE5E0',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },

  closedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#52615A',
    textAlign: 'center',
  },

  closedSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: '#7A8880',
    textAlign: 'center',
  },


  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#718078',
  },


  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EAF7F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyIcon: {
    fontSize: 28,
    fontWeight: '800',
    color: '#178A55',
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#123B2A',
    marginBottom: 7,
  },

  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#728078',
    textAlign: 'center',
    marginBottom: 20,
  },

  backToJobsButton: {
    minHeight: 48,
    paddingHorizontal: 25,
    borderRadius: 13,
    backgroundColor: '#178A55',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backToJobsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  bottomSpace: {
    height: 20,
  },
});