import React, { useCallback, useEffect, useState } from 'react';
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
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

type Job = {
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  jobType: string;
  status: string;
  categoryName: string;
};

export default function JobRequestScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    userId?: string;
    fullName?: string;
    workerId?: string;
    workerName?: string;
  }>();

  const userId = params.userId ? String(params.userId) : '';
  const fullName = params.fullName ? String(params.fullName) : 'Employer';

  const workerId = params.workerId ? String(params.workerId) : '';
  const workerName = params.workerName
    ? String(params.workerName)
    : 'Selected Worker';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [requestNote, setRequestNote] = useState('');

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [sending, setSending] = useState(false);

  const selectedJob = jobs.find(
    (job) => job.id === selectedJobId
  );

  // ---------------------------------------------------------
  // LOAD EMPLOYER JOBS
  // ---------------------------------------------------------

  const loadJobs = useCallback(async () => {
    if (!userId) {
      setLoadingJobs(false);
      return;
    }

    try {
      setLoadingJobs(true);

      const response = await fetch(
        `${API_BASE_URL}/get-employer-jobs.php?userId=${encodeURIComponent(
          userId
        )}`
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          'The server returned an invalid response.'
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Unable to load your jobs.'
        );
      }

      const openJobs: Job[] = (data.jobs || [])
        .filter((job: Job) => job.status === 'Open')
        .map((job: Job) => ({
          id: Number(job.id),
          title: String(job.title || ''),
          description: String(job.description || ''),
          budget: Number(job.budget || 0),
          location: String(job.location || ''),
          jobType: String(job.jobType || ''),
          status: String(job.status || ''),
          categoryName: String(job.categoryName || ''),
        }));

      setJobs(openJobs);

      if (openJobs.length > 0) {
        setSelectedJobId(openJobs[0].id);
      }
    } catch (error: any) {
      console.log('LOAD JOBS ERROR:', error);

      Alert.alert(
        'Unable to Load Jobs',
        error?.message ||
          'Something went wrong while loading your jobs.'
      );
    } finally {
      setLoadingJobs(false);
    }
  }, [userId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ---------------------------------------------------------
  // SEND REQUEST
  // ---------------------------------------------------------

  const handleSendRequest = async () => {
    if (!userId) {
      Alert.alert(
        'Missing Employer',
        'Your employer account information was not found. Please log in again.'
      );
      return;
    }

    if (!workerId) {
      Alert.alert(
        'Missing Worker',
        'No worker was selected. Please return to the worker profile and try again.'
      );
      return;
    }

    if (!selectedJobId) {
      Alert.alert(
        'Select a Job',
        'Please select one of your open jobs.'
      );
      return;
    }

    if (!requestNote.trim()) {
      Alert.alert(
        'Add a Message',
        'Please enter a message or schedule details for the worker.'
      );
      return;
    }

    Alert.alert(
      'Send Job Request',
      `Send this job request to ${workerName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: sendRequest,
        },
      ]
    );
  };

  const sendRequest = async () => {
    try {
      setSending(true);

      const response = await fetch(
        `${API_BASE_URL}/create-job-request.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employerId: Number(userId),
            workerId: Number(workerId),
            jobId: Number(selectedJobId),
            requestNote: requestNote.trim(),
          }),
        }
      );

      const text = await response.text();

      console.log('CREATE JOB REQUEST RESPONSE:', text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          'The server returned an invalid response.'
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'Unable to send the job request.'
        );
      }

      Alert.alert(
        'Request Sent',
        `Your job request has been sent to ${workerName}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: '/employer/job-requests',
                params: {
                  userId,
                  fullName,
                },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.log('SEND REQUEST ERROR:', error);

      Alert.alert(
        'Request Failed',
        error?.message ||
          'Something went wrong while sending the job request.'
      );
    } finally {
      setSending(false);
    }
  };

  // ---------------------------------------------------------
  // FORMAT BUDGET
  // ---------------------------------------------------------

  const formatBudget = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ---------------------------------------------------------
  // SCREEN
  // ---------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

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

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Send Job Request
            </Text>

            <Text style={styles.headerSubtitle}>
              Invite a worker directly
            </Text>
          </View>
        </View>

        {/* WORKER */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Selected Worker
          </Text>

          <View style={styles.workerCard}>
            <View style={styles.workerIcon}>
              <Ionicons
                name="person"
                size={24}
                color={GREEN}
              />
            </View>

            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>
                {workerName}
              </Text>

              <Text style={styles.workerLabel}>
                Job seeker
              </Text>
            </View>

            <Ionicons
              name="checkmark-circle"
              size={24}
              color={GREEN}
            />
          </View>
        </View>

        {/* SELECT JOB */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Select Job
          </Text>

          <Text style={styles.sectionDescription}>
            Choose one of your open jobs for this request.
          </Text>

          {loadingJobs ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="small"
                color={GREEN}
              />

              <Text style={styles.loadingText}>
                Loading your jobs...
              </Text>
            </View>
          ) : jobs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="briefcase-outline"
                size={32}
                color="#9AA6A2"
              />

              <Text style={styles.emptyTitle}>
                No Open Jobs
              </Text>

              <Text style={styles.emptyText}>
                You need an open job before you can send a
                direct request.
              </Text>

              <Pressable
                style={styles.postJobButton}
                onPress={() =>
                  router.push({
                    pathname: '/employer/post-job',
                    params: {
                      userId,
                      fullName,
                    },
                  })
                }
              >
                <Text style={styles.postJobButtonText}>
                  Post a Job
                </Text>
              </Pressable>
            </View>
          ) : (
            jobs.map((job) => {
              const selected =
                selectedJobId === job.id;

              return (
                <Pressable
                  key={job.id}
                  style={[
                    styles.jobOption,
                    selected &&
                      styles.jobOptionSelected,
                  ]}
                  onPress={() =>
                    setSelectedJobId(job.id)
                  }
                >
                  <View
                    style={[
                      styles.radioOuter,
                      selected &&
                        styles.radioOuterSelected,
                    ]}
                  >
                    {selected && (
                      <View style={styles.radioInner} />
                    )}
                  </View>

                  <View style={styles.jobOptionInfo}>
                    <Text style={styles.jobTitle}>
                      {job.title}
                    </Text>

                    {job.categoryName ? (
                      <Text style={styles.categoryText}>
                        {job.categoryName}
                      </Text>
                    ) : null}

                    <View style={styles.jobDetailRow}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#6F7D78"
                      />

                      <Text style={styles.jobDetailText}>
                        {job.location}
                      </Text>
                    </View>

                    <View style={styles.jobDetailRow}>
                      <Ionicons
                        name="cash-outline"
                        size={16}
                        color="#6F7D78"
                      />

                      <Text style={styles.jobDetailText}>
                        {formatBudget(job.budget)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* SELECTED JOB DETAILS */}

        {selectedJob && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Job Details
            </Text>

            <View style={styles.detailsCard}>
              <DetailRow
                icon="briefcase-outline"
                label="Job"
                value={selectedJob.title}
              />

              <DetailRow
                icon="cash-outline"
                label="Budget"
                value={formatBudget(
                  selectedJob.budget
                )}
              />

              <DetailRow
                icon="location-outline"
                label="Work Location"
                value={selectedJob.location}
              />

              <DetailRow
                icon="calendar-outline"
                label="Job Type"
                value={selectedJob.jobType}
              />

              <View style={styles.descriptionContainer}>
                <Text style={styles.detailLabel}>
                  Job Description
                </Text>

                <Text style={styles.descriptionText}>
                  {selectedJob.description}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* MESSAGE / SCHEDULE */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Message and Schedule Details
          </Text>

          <Text style={styles.sectionDescription}>
            Add the schedule and any important details
            you want the worker to know.
          </Text>

          <TextInput
            style={styles.textArea}
            value={requestNote}
            onChangeText={setRequestNote}
            placeholder={
              'Example: Monday to Friday, 8:00 AM–5:00 PM. Please arrive at the location before 8:00 AM.'
            }
            placeholderTextColor="#9AA6A2"
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />

          <Text style={styles.characterCount}>
            {requestNote.length}/1000
          </Text>
        </View>

        {/* SEND BUTTON */}

        <Pressable
          style={[
            styles.sendButton,
            (sending ||
              loadingJobs ||
              jobs.length === 0) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSendRequest}
          disabled={
            sending ||
            loadingJobs ||
            jobs.length === 0
          }
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <>
              <Ionicons
                name="send"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.sendButtonText}>
                Send Job Request
              </Text>
            </>
          )}
        </Pressable>

        <Text style={styles.bottomNote}>
          The worker will receive this request and can
          accept or decline it.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------
// DETAIL ROW
// ---------------------------------------------------------

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons
        name={icon}
        size={19}
        color={GREEN}
      />

      <View style={styles.detailContent}>
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

// ---------------------------------------------------------
// COLORS
// ---------------------------------------------------------

const NAVY = '#12343B';
const GREEN = '#2E7D32';
const LIGHT_GREEN = '#EAF6ED';
const BORDER = '#DDE7E2';

// ---------------------------------------------------------
// STYLES
// ---------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F2F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
  },

  headerSubtitle: {
    fontSize: 13,
    color: '#718079',
    marginTop: 3,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 7,
  },

  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#718079',
    marginBottom: 12,
  },

  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  workerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  workerInfo: {
    flex: 1,
  },

  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },

  workerLabel: {
    fontSize: 12,
    color: '#718079',
    marginTop: 3,
  },

  loadingBox: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: '#FAFCFB',
  },

  loadingText: {
    marginTop: 9,
    color: '#718079',
    fontSize: 13,
  },

  emptyBox: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: '#FAFCFB',
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },

  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: '#718079',
  },

  postJobButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: GREEN,
  },

  postJobButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  jobOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
  },

  jobOptionSelected: {
    borderColor: GREEN,
    backgroundColor: '#F5FBF6',
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#AAB8B1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },

  radioOuterSelected: {
    borderColor: GREEN,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: GREEN,
  },

  jobOptionInfo: {
    flex: 1,
  },

  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },

  categoryText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 6,
  },

  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  jobDetailText: {
    marginLeft: 6,
    flex: 1,
    fontSize: 13,
    color: '#64736D',
  },

  detailsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FAFCFB',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  detailContent: {
    flex: 1,
    marginLeft: 10,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A8882',
    textTransform: 'uppercase',
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 14,
    lineHeight: 20,
    color: NAVY,
    fontWeight: '600',
  },

  descriptionContainer: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
  },

  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#53635C',
  },

  textArea: {
    minHeight: 135,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 14,
    lineHeight: 21,
    color: NAVY,
    backgroundColor: '#FFFFFF',
  },

  characterCount: {
    textAlign: 'right',
    marginTop: 5,
    fontSize: 11,
    color: '#8A9691',
  },

  sendButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 4,
  },

  sendButtonDisabled: {
    opacity: 0.55,
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  bottomNote: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8882',
  },
});