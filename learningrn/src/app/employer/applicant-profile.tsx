import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

type Applicant = {
  applicationId: number;
  jobId: number;
  workerId: number;
  workerName: string;
  workerEmail?: string;
  workerMobile?: string;
  workerLocation?: string;
  service?: string;
  rating?: number;
  reviews?: number;
  experience?: string;
  verified?: boolean;
  availability?: string;
  skills?: string[];
  about?: string;
  jobTitle: string;
  budget: number;
  schedule?: string;
  applicationMessage?: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  appliedAt?: string;
};

export default function ApplicantProfileScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const userId = String(params.userId || '');
  const fullName = String(params.fullName || 'Employer');

  const applicationId = String(
    params.applicationId || params.applicantId || ''
  );

  const jobId = String(params.jobId || '');
  const jobTitleParam = String(params.jobTitle || '');

  const [applicant, setApplicant] = useState<Applicant | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplicant();
  }, []);

  const loadApplicant = async () => {
    try {
      if (!applicationId || !jobId || !userId) {
        Alert.alert(
          'Missing Information',
          'Applicant, job, or employer information is missing.'
        );
        setLoading(false);
        return;
      }

      const url =
        `${API_BASE_URL}/get-job-applications.php` +
        `?jobId=${encodeURIComponent(jobId)}` +
        `&employerId=${encodeURIComponent(userId)}`;

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || 'Failed to load applicant.'
        );
      }

      const applicants = Array.isArray(data.applicants)
        ? data.applicants
        : [];

      const found = applicants.find(
        (item: any) =>
          String(
            item.applicationId ??
              item.application_id ??
              item.id
          ) === String(applicationId)
      );

      if (!found) {
        throw new Error('Applicant information was not found.');
      }

      const normalized: Applicant = {
        applicationId: Number(
          found.applicationId ??
            found.application_id ??
            found.id
        ),

        jobId: Number(
          found.jobId ??
            found.job_id ??
            jobId
        ),

        workerId: Number(
          found.workerId ??
            found.worker_id ??
            0
        ),

        workerName:
          found.workerName ??
          found.worker_name ??
          'Worker',

        workerEmail:
          found.workerEmail ??
          found.worker_email ??
          '',

        workerMobile:
          found.workerMobile ??
          found.worker_mobile ??
          '',

        workerLocation:
          found.workerLocation ??
          found.worker_location ??
          found.location ??
          'Not specified',

        service:
          found.service ??
          found.categoryName ??
          found.category_name ??
          'Informal Worker',

        rating: Number(
          found.rating ??
            found.averageRating ??
            found.average_rating ??
            0
        ),

        reviews: Number(
          found.reviews ??
            found.totalReviews ??
            found.total_reviews ??
            0
        ),

        experience:
          found.experience ??
          'Not specified',

        verified:
          Boolean(
            found.verified ??
              found.isVerified ??
              found.is_verified ??
              false
          ),

        availability:
          found.availability ??
          'Available',

        skills: Array.isArray(found.skills)
          ? found.skills
          : typeof found.skills === 'string' &&
              found.skills.trim() !== ''
            ? found.skills
                .split(',')
                .map((skill: string) => skill.trim())
                .filter(Boolean)
            : [],

        about:
          found.about ??
          found.aboutMe ??
          found.about_me ??
          'No information provided.',

        jobTitle:
          found.jobTitle ??
          found.job_title ??
          jobTitleParam ??
          'Job',

        budget: Number(
          found.budget ?? 0
        ),

        schedule:
          found.schedule ??
          'Schedule to be discussed',

        applicationMessage:
          found.applicationMessage ??
          found.coverLetter ??
          found.cover_letter ??
          'No application message provided.',

        status:
          found.status === 'Accepted'
            ? 'Accepted'
            : found.status === 'Rejected'
              ? 'Rejected'
              : 'Pending',

        appliedAt:
          found.appliedAt ??
          found.applied_at ??
          '',
      };

      setApplicant(normalized);
    } catch (error: any) {
      console.error('Load applicant error:', error);

      Alert.alert(
        'Error',
        error?.message || 'Unable to load applicant information.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (
    status: 'Accepted' | 'Rejected'
  ) => {
    if (!applicant) return;

    try {
      setProcessing(true);

      const response = await fetch(
        `${API_BASE_URL}/update-job-application-status.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationId: applicant.applicationId,
            employerId: Number(userId),
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            'Unable to update application status.'
        );
      }

      setApplicant((previous) =>
        previous
          ? {
              ...previous,
              status,
            }
          : previous
      );

      if (status === 'Accepted') {
        Alert.alert(
          'Application Accepted',
          `${applicant.workerName} has been accepted for ${applicant.jobTitle}.`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace({
                  pathname: '/employer/applicants',
                  params: {
                    userId,
                    fullName,
                    jobId: String(applicant.jobId),
                    jobTitle: applicant.jobTitle,
                  },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Application Rejected',
          `${applicant.workerName}'s application has been rejected.`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace({
                  pathname: '/employer/applicants',
                  params: {
                    userId,
                    fullName,
                    jobId: String(applicant.jobId),
                    jobTitle: applicant.jobTitle,
                  },
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Update application status error:', error);

      Alert.alert(
        'Error',
        error?.message ||
          'Unable to update the application. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = () => {
    if (!applicant) return;

    if (applicant.status === 'Accepted') {
      Alert.alert(
        'Already Accepted',
        'This applicant has already been accepted.'
      );
      return;
    }

    if (applicant.status === 'Rejected') {
      Alert.alert(
        'Application Rejected',
        'This application has already been rejected.'
      );
      return;
    }

    Alert.alert(
      'Accept Applicant',
      `Are you sure you want to accept ${applicant.workerName} for this job?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: () => {
            updateApplicationStatus('Accepted');
          },
        },
      ]
    );
  };

  const handleReject = () => {
    if (!applicant) return;

    if (applicant.status === 'Rejected') {
      Alert.alert(
        'Already Rejected',
        'This applicant has already been rejected.'
      );
      return;
    }

    if (applicant.status === 'Accepted') {
      Alert.alert(
        'Application Accepted',
        'This applicant has already been accepted.'
      );
      return;
    }

    Alert.alert(
      'Reject Applicant',
      `Are you sure you want to reject ${applicant.workerName}'s application?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            updateApplicationStatus('Rejected');
          },
        },
      ]
    );
  };

  const formatBudget = (value: number) => {
    if (!value || value <= 0) {
      return 'Not specified';
    }

    return `₱${value.toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FAF7F2"
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={GREEN}
          />

          <Text style={styles.loadingText}>
            Loading applicant...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!applicant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FAF7F2"
        />

        <View style={styles.loadingContainer}>
          <Ionicons
            name="person-outline"
            size={42}
            color="#A0A6AB"
          />

          <Text style={styles.emptyTitle}>
            Applicant Not Found
          </Text>

          <Text style={styles.emptyText}>
            The applicant information could not be loaded.
          </Text>

          <Pressable
            style={styles.backToApplicantsButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToApplicantsText}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FAF7F2"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            Applicant Profile
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {applicant.workerName
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>
            {applicant.workerName}
          </Text>

          <View style={styles.verifiedRow}>
            {applicant.verified && (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={GREEN}
                />

                <Text style={styles.verifiedText}>
                  Verified Worker
                </Text>
              </>
            )}
          </View>

          <Text style={styles.service}>
            {applicant.service}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color="#737B82"
            />

            <Text style={styles.locationText}>
              {applicant.workerLocation ||
                'Location not specified'}
            </Text>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.stat}>
              <Ionicons
                name="star"
                size={16}
                color="#D49A25"
              />

              <Text style={styles.statValue}>
                {applicant.rating
                  ? applicant.rating.toFixed(1)
                  : '0.0'}
              </Text>

              <Text style={styles.statLabel}>
                Rating
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {applicant.reviews || 0}
              </Text>

              <Text style={styles.statLabel}>
                Reviews
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {applicant.experience || 'N/A'}
              </Text>

              <Text style={styles.statLabel}>
                Experience
              </Text>
            </View>
          </View>
        </View>

        {/* Application Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Application Status
          </Text>

          <View
            style={[
              styles.statusCard,
              applicant.status === 'Accepted'
                ? styles.statusAccepted
                : applicant.status === 'Rejected'
                  ? styles.statusRejected
                  : styles.statusPending,
            ]}
          >
            <Ionicons
              name={
                applicant.status === 'Accepted'
                  ? 'checkmark-circle'
                  : applicant.status === 'Rejected'
                    ? 'close-circle'
                    : 'time-outline'
              }
              size={20}
              color={
                applicant.status === 'Accepted'
                  ? GREEN
                  : applicant.status === 'Rejected'
                    ? '#A34B4B'
                    : '#A77A17'
              }
            />

            <Text
              style={[
                styles.statusText,
                applicant.status === 'Accepted'
                  ? styles.statusTextAccepted
                  : applicant.status === 'Rejected'
                    ? styles.statusTextRejected
                    : styles.statusTextPending,
              ]}
            >
              {applicant.status}
            </Text>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Availability
          </Text>

          <View style={styles.availabilityCard}>
            <View style={styles.availableIcon}>
              <Ionicons
                name="checkmark"
                size={17}
                color={GREEN}
              />
            </View>

            <View style={styles.availabilityTextContainer}>
              <Text style={styles.availabilityTitle}>
                {applicant.availability ||
                  'Available'}
              </Text>

              <Text style={styles.availabilitySubtitle}>
                Worker is currently accepting jobs
              </Text>
            </View>
          </View>
        </View>

        {/* Application Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Application Details
          </Text>

          <View style={styles.detailsCard}>
            <DetailRow
              icon="briefcase-outline"
              label="Job"
              value={applicant.jobTitle}
            />

            <DetailRow
              icon="cash-outline"
              label="Budget"
              value={formatBudget(
                applicant.budget
              )}
            />

            <DetailRow
              icon="calendar-outline"
              label="Schedule"
              value={
                applicant.schedule ||
                'Schedule to be discussed'
              }
            />
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Skills
          </Text>

          <View style={styles.skillsCard}>
            <View style={styles.skillsContainer}>
              {(applicant.skills || []).length >
              0 ? (
                applicant.skills!.map((skill) => (
                  <View
                    key={skill}
                    style={styles.skillBadge}
                  >
                    <Text style={styles.skillText}>
                      {skill}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>
                  No skills listed.
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            About the Worker
          </Text>

          <View style={styles.textCard}>
            <Text style={styles.bodyText}>
              {applicant.about ||
                'No information provided.'}
            </Text>
          </View>
        </View>

        {/* Application Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Application Message
          </Text>

          <View style={styles.messageCard}>
            <View style={styles.messageIcon}>
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={NAVY}
              />
            </View>

            <Text style={styles.messageText}>
              {applicant.applicationMessage ||
                'No application message provided.'}
            </Text>
          </View>
        </View>

        {/* Previous Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Ratings & Reviews
            </Text>

            <Text style={styles.reviewCount}>
              {applicant.reviews || 0} reviews
            </Text>
          </View>

          <View style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewAvatarText}>
                  A
                </Text>
              </View>

              <View style={styles.reviewPerson}>
                <Text style={styles.reviewerName}>
                  Previous Employer
                </Text>

                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={12}
                        color="#D49A25"
                      />
                    )
                  )}
                </View>
              </View>
            </View>

            <Text style={styles.reviewText}>
              Good worker and completed the
              assigned task properly.
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        {applicant.status === 'Pending' && (
          <View style={styles.bottomActions}>
            <Pressable
              style={[
                styles.rejectButton,
                processing &&
                  styles.disabledButton,
              ]}
              onPress={handleReject}
              disabled={processing}
            >
              <Ionicons
                name="close-outline"
                size={19}
                color="#A34B4B"
              />

              <Text style={styles.rejectText}>
                Reject
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.acceptButton,
                processing &&
                  styles.disabledAcceptButton,
              ]}
              onPress={handleAccept}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.acceptText}>
                    Accept Applicant
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        <Text style={styles.demoNote}>
          Application ID: {applicant.applicationId}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function DetailRow({
  icon,
  label,
  value,
}: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={NAVY}
        />
      </View>

      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>
      </View>
    </View>
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

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: '#737B82',
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 11,
    color: '#737B82',
    textAlign: 'center',
  },

  backToApplicantsButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: NAVY,
  },

  backToApplicantsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: GREEN,
  },

  name: {
    fontSize: 19,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 5,
  },

  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    minHeight: 16,
  },

  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 4,
  },

  service: {
    fontSize: 12,
    color: '#606A72',
    fontWeight: '600',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  locationText: {
    fontSize: 10,
    color: '#737B82',
    marginLeft: 4,
  },

  profileStats: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 19,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFF0F1',
  },

  stat: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
    marginTop: 2,
  },

  statLabel: {
    fontSize: 8,
    color: '#858C92',
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7E9',
  },

  section: {
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 9,
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },

  statusAccepted: {
    borderColor: '#CDE4D0',
    backgroundColor: '#F1F8F2',
  },

  statusRejected: {
    borderColor: '#E6CCCC',
    backgroundColor: '#FBF3F3',
  },

  statusPending: {
    borderColor: '#E9D9A7',
    backgroundColor: '#FFF9E8',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },

  statusTextAccepted: {
    color: GREEN,
  },

  statusTextRejected: {
    color: '#A34B4B',
  },

  statusTextPending: {
    color: '#A77A17',
  },

  availabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  availableIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  availabilityTextContainer: {
    marginLeft: 10,
  },

  availabilityTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN,
  },

  availabilitySubtitle: {
    fontSize: 9,
    color: '#7B838A',
    marginTop: 2,
  },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F2',
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailTextContainer: {
    marginLeft: 10,
    flex: 1,
  },

  detailLabel: {
    fontSize: 8,
    color: '#858C92',
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
  },

  skillsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  skillBadge: {
    backgroundColor: '#EAF5EC',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  skillText: {
    fontSize: 9,
    fontWeight: '700',
    color: GREEN,
  },

  noDataText: {
    fontSize: 10,
    color: '#858C92',
  },

  textCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  bodyText: {
    fontSize: 10,
    lineHeight: 17,
    color: '#626C73',
  },

  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9E5DF',
    flexDirection: 'row',
  },

  messageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  messageText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 17,
    color: '#626C73',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  reviewCount: {
    fontSize: 9,
    color: '#858C92',
  },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  reviewAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  reviewAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: NAVY,
  },

  reviewPerson: {
    marginLeft: 9,
  },

  reviewerName: {
    fontSize: 10,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 3,
  },

  stars: {
    flexDirection: 'row',
    gap: 2,
  },

  reviewText: {
    fontSize: 10,
    color: '#626C73',
    lineHeight: 16,
    marginTop: 11,
  },

  bottomActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 25,
  },

  rejectButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFCACA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejectText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A34B4B',
    marginLeft: 4,
  },

  acceptButton: {
    flex: 1.35,
    height: 46,
    borderRadius: 10,
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  acceptText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },

  disabledButton: {
    opacity: 0.6,
  },

  disabledAcceptButton: {
    opacity: 0.65,
  },

  demoNote: {
    textAlign: 'center',
    fontSize: 8,
    color: '#A0A6AB',
    marginTop: 15,
  },
});