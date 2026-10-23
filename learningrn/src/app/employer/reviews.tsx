import React, { useCallback, useMemo, useState } from 'react';
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
  TextInput,
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

type WorkerReview = {
  id: number;
  ratingId: number;
  jobId: number;
  employerId: number;
  workerId: number;
  workerName: string;
  jobTitle: string;
  rating: number;
  review: string;
  date: string;
};

type ReviewableJob = {
  id: number;
  title: string;
  workerId: number;
  worker: string;
  status: string;
};

export default function ReviewsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    userId?: string;
    fullName?: string;
  }>();

  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId || '';

  const fullName = Array.isArray(params.fullName)
    ? params.fullName[0]
    : params.fullName || 'Employer';

  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [reviewableJobs, setReviewableJobs] = useState<
    ReviewableJob[]
  >([]);

  const [showRatingForm, setShowRatingForm] =
    useState(false);

  const [showWorkerList, setShowWorkerList] =
    useState(false);

  const [selectedJob, setSelectedJob] =
    useState<ReviewableJob | null>(null);

  const [rating, setRating] = useState(0);

  const [reviewText, setReviewText] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  // --------------------------------------------------
  // LOAD EXISTING REVIEWS
  // --------------------------------------------------

  const loadReviews = useCallback(async () => {
    if (!userId) {
      setReviews([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/get-employer-reviews.php?employerId=${encodeURIComponent(
          userId
        )}`
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          'The reviews API returned an invalid response.'
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load reviews.'
        );
      }

      setReviews(
        Array.isArray(data.reviews)
          ? data.reviews
          : []
      );
    } catch (error: any) {
      console.error('Load reviews error:', error);

      Alert.alert(
        'Unable to Load Reviews',
        error.message ||
          'Please check your connection and try again.'
      );
    }
  }, [userId]);

  // --------------------------------------------------
  // LOAD JOB HISTORY
  // --------------------------------------------------

  const loadReviewableJobs = useCallback(async () => {
    if (!userId) {
      setReviewableJobs([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/get-employer-job-history.php?employerId=${encodeURIComponent(
          userId
        )}`
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          'The job history API returned an invalid response.'
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to load completed jobs.'
        );
      }

      const rawJobs =
        data.jobs ||
        data.history ||
        data.jobHistory ||
        [];

      const normalized: ReviewableJob[] =
        Array.isArray(rawJobs)
          ? rawJobs
              .map((job: any) => ({
                id: Number(
                  job.id ?? job.jobId ?? job.job_id
                ),
                title:
                  job.title ??
                  job.jobTitle ??
                  job.job_title ??
                  'Job',
                workerId: Number(
                  job.workerId ??
                    job.worker_id ??
                    0
                ),
                worker:
                  job.worker ??
                  job.workerName ??
                  job.worker_name ??
                  'Worker',
                status:
                  job.status ?? '',
              }))
              .filter(
                (job: ReviewableJob) =>
                  job.id > 0 &&
                  job.workerId > 0
              )
          : [];

      setReviewableJobs(normalized);
    } catch (error) {
      console.error(
        'Load reviewable jobs error:',
        error
      );

      setReviewableJobs([]);
    }
  }, [userId]);

  // --------------------------------------------------
  // LOAD SCREEN
  // --------------------------------------------------

  const loadScreen = useCallback(async () => {
    setLoading(true);

    await Promise.all([
      loadReviews(),
      loadReviewableJobs(),
    ]);

    setLoading(false);
  }, [loadReviews, loadReviewableJobs]);

  useFocusEffect(
    useCallback(() => {
      loadScreen();
    }, [loadScreen])
  );

  // --------------------------------------------------
  // REMOVE JOBS THAT ARE ALREADY REVIEWED
  // --------------------------------------------------

  const availableJobs = useMemo(() => {
    return reviewableJobs.filter((job) => {
      return !reviews.some(
        (review) =>
          Number(review.jobId) ===
            Number(job.id) &&
          Number(review.workerId) ===
            Number(job.workerId)
      );
    });
  }, [reviewableJobs, reviews]);

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  const onRefresh = async () => {
    setRefreshing(true);

    await Promise.all([
      loadReviews(),
      loadReviewableJobs(),
    ]);

    setRefreshing(false);
  };

  // --------------------------------------------------
  // OPEN RATING FORM
  // --------------------------------------------------

  const openRatingForm = () => {
    if (availableJobs.length === 0) {
      Alert.alert(
        'No Worker Available',
        'There is no completed or assigned job available for review yet.'
      );

      return;
    }

    setSelectedJob(availableJobs[0]);
    setRating(0);
    setReviewText('');
    setShowWorkerList(false);
    setShowRatingForm(true);
  };

  // --------------------------------------------------
  // CANCEL FORM
  // --------------------------------------------------

  const cancelRating = () => {
    setShowRatingForm(false);
    setShowWorkerList(false);
    setSelectedJob(null);
    setRating(0);
    setReviewText('');
  };

  // --------------------------------------------------
  // SUBMIT REVIEW
  // --------------------------------------------------

  const submitReview = async () => {
    if (!userId) {
      Alert.alert(
        'Employer Not Found',
        'Please log in again before submitting a review.'
      );

      return;
    }

    if (!selectedJob) {
      Alert.alert(
        'Worker Required',
        'Please select a worker first.'
      );

      return;
    }

    if (rating === 0) {
      Alert.alert(
        'Rating Required',
        'Please select a star rating first.'
      );

      return;
    }

    if (!reviewText.trim()) {
      Alert.alert(
        'Review Required',
        'Please write a short review.'
      );

      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/create-review.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: Number(selectedJob.id),
            employerId: Number(userId),
            workerId: Number(
              selectedJob.workerId
            ),
            rating: Number(rating),
            reviewText: reviewText.trim(),
          }),
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          'The server returned an invalid response.'
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to submit review.'
        );
      }

      const workerName =
        selectedJob.worker;

      setShowRatingForm(false);
      setShowWorkerList(false);
      setSelectedJob(null);
      setRating(0);
      setReviewText('');

      await Promise.all([
        loadReviews(),
        loadReviewableJobs(),
      ]);

      Alert.alert(
        'Review Submitted',
        `Thank you for rating ${workerName}.`
      );
    } catch (error: any) {
      console.error(
        'Submit review error:',
        error
      );

      Alert.alert(
        'Unable to Submit Review',
        error.message ||
          'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // DATE FORMAT
  // --------------------------------------------------

  const formatDate = (value: string) => {
    if (!value) {
      return '';
    }

    const normalized =
      value.includes('T')
        ? value
        : value.replace(' ', 'T');

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      'en-PH',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
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

          <Text style={styles.headerTitle}>
            Reviews
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* TITLE */}

        <Text style={styles.pageTitle}>
          Ratings & Reviews
        </Text>

        <Text style={styles.subtitle}>
          View worker reviews and rate workers
          after completed jobs.
        </Text>

        {/* RATE WORKER */}

        {!showRatingForm && (
          <Pressable
            style={styles.rateButton}
            onPress={openRatingForm}
          >
            <Ionicons
              name="star-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.rateButtonText}>
              Rate a Worker
            </Text>
          </Pressable>
        )}

        {/* RATING FORM */}

        {showRatingForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>
                  Rate Worker
                </Text>

                <Text
                  style={styles.formSubtitle}
                >
                  Share your experience with the
                  worker.
                </Text>
              </View>

              <Pressable
                onPress={cancelRating}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={22}
                  color="#8A9197"
                />
              </Pressable>
            </View>

            {/* WORKER */}

            <Text style={styles.fieldLabel}>
              Worker
            </Text>

            <Pressable
              style={styles.workerSelect}
              onPress={() =>
                setShowWorkerList(
                  !showWorkerList
                )
              }
            >
              <View style={styles.smallAvatar}>
                <Text
                  style={
                    styles.smallAvatarText
                  }
                >
                  {selectedJob?.worker
                    ?.charAt(0)
                    .toUpperCase() || 'W'}
                </Text>
              </View>

              <View
                style={
                  styles.workerSelectInfo
                }
              >
                <Text
                  style={
                    styles.workerSelectName
                  }
                >
                  {selectedJob?.worker ||
                    'Select Worker'}
                </Text>

                <Text
                  style={
                    styles.workerSelectJob
                  }
                >
                  {selectedJob?.title ||
                    'Select a job'}
                </Text>
              </View>

              <Ionicons
                name={
                  showWorkerList
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={17}
                color="#858C92"
              />
            </Pressable>

            {/* WORKER LIST */}

            {showWorkerList && (
              <View
                style={styles.workerList}
              >
                {availableJobs.map(
                  (job) => (
                    <Pressable
                      key={`${job.id}-${job.workerId}`}
                      style={
                        styles.workerOption
                      }
                      onPress={() => {
                        setSelectedJob(job);
                        setShowWorkerList(
                          false
                        );
                      }}
                    >
                      <View
                        style={
                          styles.optionAvatar
                        }
                      >
                        <Text
                          style={
                            styles.optionAvatarText
                          }
                        >
                          {job.worker
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.optionInfo
                        }
                      >
                        <Text
                          style={
                            styles.optionName
                          }
                        >
                          {job.worker}
                        </Text>

                        <Text
                          style={
                            styles.optionJob
                          }
                        >
                          {job.title}
                        </Text>
                      </View>

                      {selectedJob?.id ===
                        job.id &&
                        selectedJob?.workerId ===
                          job.workerId && (
                          <Ionicons
                            name="checkmark-circle"
                            size={19}
                            color={GREEN}
                          />
                        )}
                    </Pressable>
                  )
                )}
              </View>
            )}

            {/* RATING */}

            <Text style={styles.fieldLabel}>
              Your Rating
            </Text>

            <View
              style={styles.starSelector}
            >
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <Pressable
                    key={star}
                    onPress={() =>
                      setRating(star)
                    }
                    style={
                      styles.starButton
                    }
                  >
                    <Ionicons
                      name={
                        star <= rating
                          ? 'star'
                          : 'star-outline'
                      }
                      size={31}
                      color="#D49A25"
                    />
                  </Pressable>
                )
              )}
            </View>

            <Text
              style={styles.ratingHint}
            >
              {rating === 0
                ? 'Tap a star to rate'
                : getRatingText(rating)}
            </Text>

            {/* REVIEW */}

            <Text style={styles.fieldLabel}>
              Your Review
            </Text>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write your experience with this worker..."
              placeholderTextColor="#9AA0A5"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              textAlignVertical="top"
              editable={!submitting}
            />

            <View
              style={styles.formActions}
            >
              <Pressable
                style={styles.cancelButton}
                onPress={cancelRating}
                disabled={submitting}
              >
                <Text
                  style={styles.cancelText}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.submitButton,
                  submitting &&
                    styles.disabledButton,
                ]}
                onPress={submitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="send-outline"
                      size={16}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.submitText
                      }
                    >
                      Submit Review
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* EXISTING REVIEWS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Your Reviews
          </Text>

          <Text style={styles.reviewCount}>
            {reviews.length}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="small"
              color={GREEN}
            />

            <Text style={styles.loadingText}>
              Loading reviews...
            </Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="star-outline"
              size={32}
              color="#A2A8AD"
            />

            <Text style={styles.emptyTitle}>
              No Reviews Yet
            </Text>

            <Text style={styles.emptyText}>
              Your submitted worker reviews
              will appear here.
            </Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View
              key={review.id}
              style={styles.reviewCard}
            >
              <View
                style={styles.reviewHeader}
              >
                <View
                  style={styles.reviewAvatar}
                >
                  <Text
                    style={
                      styles.reviewAvatarText
                    }
                  >
                    {review.workerName
                      ?.charAt(0)
                      .toUpperCase() || 'W'}
                  </Text>
                </View>

                <View
                  style={styles.reviewInfo}
                >
                  <Text
                    style={styles.workerName}
                  >
                    {review.workerName}
                  </Text>

                  <Text
                    style={styles.jobTitle}
                  >
                    {review.jobTitle}
                  </Text>

                  <View
                    style={styles.starRow}
                  >
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <Ionicons
                          key={star}
                          name={
                            star <=
                            review.rating
                              ? 'star'
                              : 'star-outline'
                          }
                          size={12}
                          color="#D49A25"
                        />
                      )
                    )}

                    <Text
                      style={
                        styles.ratingNumber
                      }
                    >
                      {Number(
                        review.rating
                      ).toFixed(1)}
                    </Text>
                  </View>
                </View>

                <Text
                  style={styles.reviewDate}
                >
                  {formatDate(review.date)}
                </Text>
              </View>

              <Text
                style={styles.reviewText}
              >
                {review.review}
              </Text>
            </View>
          ))
        )}

        {/* INFORMATION */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={NAVY}
            />
          </View>

          <Text style={styles.infoText}>
            After a job is completed, you can
            rate and review the worker based on
            your experience.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getRatingText(rating: number) {
  switch (rating) {
    case 1:
      return 'Poor';

    case 2:
      return 'Needs Improvement';

    case 3:
      return 'Good';

    case 4:
      return 'Very Good';

    case 5:
      return 'Excellent';

    default:
      return '';
  }
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

  rateButton: {
    height: 45,
    borderRadius: 10,
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  rateButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9E5DF',
    marginBottom: 22,
  },

  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },

  formSubtitle: {
    fontSize: 9,
    color: '#858C92',
    marginTop: 3,
  },

  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 7,
    marginTop: 5,
  },

  workerSelect: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E0E3E5',
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  smallAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
  },

  workerSelectInfo: {
    flex: 1,
    marginLeft: 9,
  },

  workerSelectName: {
    fontSize: 10,
    fontWeight: '800',
    color: NAVY,
  },

  workerSelectJob: {
    fontSize: 8,
    color: '#858C92',
    marginTop: 2,
  },

  workerList: {
    borderWidth: 1,
    borderColor: '#E0E3E5',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 13,
  },

  workerOption: {
    minHeight: 54,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F2',
  },

  optionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: GREEN,
  },

  optionInfo: {
    flex: 1,
    marginLeft: 9,
  },

  optionName: {
    fontSize: 10,
    fontWeight: '800',
    color: NAVY,
  },

  optionJob: {
    fontSize: 8,
    color: '#858C92',
    marginTop: 2,
  },

  starSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
  },

  starButton: {
    paddingHorizontal: 5,
  },

  ratingHint: {
    fontSize: 9,
    color: '#858C92',
    textAlign: 'center',
    marginBottom: 12,
  },

  reviewInput: {
    minHeight: 105,
    borderWidth: 1,
    borderColor: '#E0E3E5',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 10,
    color: NAVY,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },

  formActions: {
    flexDirection: 'row',
    gap: 8,
  },

  cancelButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DDE1E3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#68727A',
  },

  submitButton: {
    flex: 1.3,
    height: 42,
    borderRadius: 9,
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.65,
  },

  submitText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 5,
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

  reviewCount: {
    minWidth: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#EEF1F5',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 9,
    fontWeight: '800',
    color: NAVY,
  },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  reviewAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: GREEN,
  },

  reviewInfo: {
    flex: 1,
  },

  workerName: {
    fontSize: 11,
    fontWeight: '800',
    color: NAVY,
  },

  jobTitle: {
    fontSize: 8,
    color: '#858C92',
    marginTop: 2,
  },

  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 2,
  },

  ratingNumber: {
    fontSize: 8,
    color: '#737B82',
    marginLeft: 3,
  },

  reviewDate: {
    fontSize: 7,
    color: '#9AA0A5',
    maxWidth: 95,
    textAlign: 'right',
  },

  reviewText: {
    fontSize: 10,
    lineHeight: 16,
    color: '#626C73',
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F2',
  },

  loadingBox: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 9,
    color: '#858C92',
    marginTop: 8,
  },

  emptyCard: {
    minHeight: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9E5DF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 11,
  },

  emptyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: NAVY,
    marginTop: 8,
  },

  emptyText: {
    fontSize: 9,
    lineHeight: 14,
    color: '#858C92',
    textAlign: 'center',
    marginTop: 4,
  },

  infoCard: {
    backgroundColor: '#F1F4F7',
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },

  infoIcon: {
    marginRight: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 15,
    color: '#68727A',
  },
});