import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { Platform } from 'react-native';

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

/*
|--------------------------------------------------------------------------
| COLORS
|--------------------------------------------------------------------------
*/

const BLUE = '#1769AA';
const DARK_BLUE = '#123B5D';
const LIGHT_BLUE = '#E8F3FC';
const BACKGROUND = '#F5FAFE';
const BORDER = '#D5E6F2';
const GREEN = '#2E7D32';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Applicant = {
  applicationId: number;
  jobId: number;
  jobTitle?: string;

  workerId: number;

  fullName: string;
  email: string;
  mobileNumber: string;

  profileImage?: string | null;

  isVerified: boolean;
  verificationBadge?: string | null;

  userStatus?: string;
  barangay?: string;

  coverLetter?: string;

  proposedRate?: number | null;
  availableDate?: string | null;

  status: 'Pending' | 'Accepted' | 'Rejected';

  appliedAt?: string | null;

  categoryId?: number | null;
  categoryName?: string;

  jobStatus?: string;
  jobType?: string;
  budget?: number;
  location?: string;
};

type ApiResponse = {
  success: boolean;

  employerId?: number;

  job?: {
    id: number;
    jobId: number;
    employerId: number;
    categoryId?: number | null;
    categoryName?: string;
    title?: string;
    description?: string;
    budget?: number;
    location?: string;
    jobType?: string;
    status?: string;
    createdAt?: string | null;
    expiresAt?: string | null;
  } | null;

  applicants?: Applicant[];

  totalApplicants?: number;

  error?: string;
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function EmployerApplicantsScreen() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | ROUTE PARAMS
  |--------------------------------------------------------------------------
  */

  const params =
    useLocalSearchParams<{
      userId?: string | string[];
      fullName?: string | string[];
      jobId?: string | string[];
      jobTitle?: string | string[];
    }>();

  const getParam = (
    value: string | string[] | undefined
  ): string => {
    if (Array.isArray(value)) {
      return value[0] || '';
    }

    return value || '';
  };

  const userId = getParam(params.userId);
  const fullName = getParam(params.fullName);
  const jobId = getParam(params.jobId);
  const jobTitle = getParam(params.jobTitle);

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [applicants, setApplicants] =
    useState<Applicant[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | LOAD APPLICANTS
  |--------------------------------------------------------------------------
  */

  const loadApplicants = useCallback(
    async (
      showLoading = true
    ) => {
      /*
      |--------------------------------------------------------------------------
      | EMPLOYER ID IS REQUIRED
      |--------------------------------------------------------------------------
      */

      if (!userId) {
        console.log(
          '===================================='
        );

        console.log(
          'EMPLOYER APPLICANTS'
        );

        console.log(
          'userId:',
          userId
        );

        console.log(
          'jobId:',
          jobId
        );

        console.log(
          'jobTitle:',
          jobTitle
        );

        console.log(
          'Missing employer userId.'
        );

        setError(
          'Employer information is missing.'
        );

        setLoading(false);

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | JOB ID IS OPTIONAL
      |--------------------------------------------------------------------------
      |
      | If jobId exists:
      |   specific job applicants
      |
      | If jobId does NOT exist:
      |   all applicants for this employer
      |
      |--------------------------------------------------------------------------
      */

      console.log(
        '===================================='
      );

      console.log(
        'EMPLOYER APPLICANTS'
      );

      console.log(
        'userId:',
        userId
      );

      console.log(
        'jobId:',
        jobId
      );

      console.log(
        'jobTitle:',
        jobTitle
      );

      if (jobId) {
        console.log(
          'Loading applicants for specific job:',
          jobId
        );
      } else {
        console.log(
          'Loading ALL applicants for employer:',
          userId
        );
      }

      if (showLoading) {
        setLoading(true);
      }

      setError('');

      try {
        /*
        |--------------------------------------------------------------------------
        | BUILD URL
        |--------------------------------------------------------------------------
        */

        let url =
          `${API_BASE_URL}/get-job-applications.php` +
          `?employerId=${encodeURIComponent(
            userId
          )}`;

        /*
        |--------------------------------------------------------------------------
        | ONLY ADD jobId IF IT EXISTS
        |--------------------------------------------------------------------------
        */

        if (jobId) {
          url +=
            `&jobId=${encodeURIComponent(
              jobId
            )}`;
        }

        console.log(
          'Applicants API URL:',
          url
        );

        /*
        |--------------------------------------------------------------------------
        | REQUEST
        |--------------------------------------------------------------------------
        */

        const response =
          await fetch(url);

        const text =
          await response.text();

        console.log(
          'Applicants API status:',
          response.status
        );

        console.log(
          'Applicants API response:',
          text
        );

        let data: ApiResponse;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            'The server returned an invalid response.'
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to load applicants.'
          );
        }

        if (!data.success) {
          throw new Error(
            data.error ||
              'Failed to load applicants.'
          );
        }

        /*
        |--------------------------------------------------------------------------
        | SAVE APPLICANTS
        |--------------------------------------------------------------------------
        */

        const loadedApplicants =
          Array.isArray(
            data.applicants
          )
            ? data.applicants
            : [];

        setApplicants(
          loadedApplicants
        );

        console.log(
          'Total applicants:',
          loadedApplicants.length
        );

      } catch (err: any) {
        console.error(
          'Applicants error:',
          err
        );

        setError(
          err?.message ||
            'Unable to load applicants.'
        );

      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      userId,
      jobId,
      jobTitle,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadApplicants(true);
  }, [loadApplicants]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const onRefresh = () => {
    setRefreshing(true);

    loadApplicants(false);
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN APPLICANT PROFILE
  |--------------------------------------------------------------------------
  */

  const openApplicantProfile = (
    applicant: Applicant
  ) => {
    console.log(
      'OPEN APPLICANT PROFILE'
    );

    console.log(
      'Employer ID:',
      userId
    );

    console.log(
      'Job ID:',
      applicant.jobId
    );

    console.log(
      'Application ID:',
      applicant.applicationId
    );

    console.log(
      'Worker ID:',
      applicant.workerId
    );

    router.push({
      pathname:
        '/employer/applicant-profile',
      params: {
        userId: String(userId),

        fullName:
          String(fullName || 'Employer'),

        jobId:
          String(applicant.jobId),

        applicationId:
          String(
            applicant.applicationId
          ),

        workerId:
          String(applicant.workerId),

        applicantName:
          String(
            applicant.fullName || ''
          ),

        jobTitle:
          String(
            applicant.jobTitle || ''
          ),
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (
    dateString?: string | null
  ) => {
    if (!dateString) {
      return 'Unknown date';
    }

    const date =
      new Date(
        dateString.replace(
          ' ',
          'T'
        )
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString;
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
  |--------------------------------------------------------------------------
  | STATUS COLOR
  |--------------------------------------------------------------------------
  */

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case 'Accepted':
        return GREEN;

      case 'Rejected':
        return '#C62828';

      default:
        return '#F57C00';
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color={BLUE}
          />

          <Text
            style={styles.loadingText}
          >
            Loading applicants...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* ================================================================
          HEADER
      ================================================================ */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={DARK_BLUE}
          />
        </TouchableOpacity>

        <View
          style={styles.headerTextContainer}
        >
          <Text
            style={styles.headerTitle}
          >
            Applicants
          </Text>

          <Text
            style={styles.headerSubtitle}
            numberOfLines={1}
          >
            {jobId && jobTitle
              ? jobTitle
              : 'All job applicants'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.8}
        >
          <Ionicons
            name="refresh-outline"
            size={21}
            color={BLUE}
          />
        </TouchableOpacity>
      </View>

      {/* ================================================================
          EMPLOYER INFO
      ================================================================ */}

      <View
        style={styles.employerCard}
      >
        <View
          style={styles.employerIcon}
        >
          <Ionicons
            name="people"
            size={21}
            color={BLUE}
          />
        </View>

        <View
          style={styles.employerInfo}
        >
          <Text
            style={styles.employerLabel}
          >
            APPLICANTS
          </Text>

          <Text
            style={styles.employerCount}
          >
            {applicants.length}{' '}
            applicant
            {applicants.length === 1
              ? ''
              : 's'}
          </Text>
        </View>
      </View>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error ? (
        <View
          style={styles.errorCard}
        >
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color="#C62828"
          />

          <Text
            style={styles.errorText}
          >
            {error}
          </Text>
        </View>
      ) : null}

      {/* ================================================================
          APPLICANTS
      ================================================================ */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BLUE}
          />
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {applicants.length === 0 ? (
          <View
            style={styles.emptyContainer}
          >
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="people-outline"
                size={40}
                color={BLUE}
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No Applicants Yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              When workers apply for
              your jobs, their
              applications will appear
              here.
            </Text>
          </View>
        ) : (
          applicants.map(
            (
              applicant
            ) => (
              <TouchableOpacity
                key={`${applicant.applicationId}`}
                style={
                  styles.applicantCard
                }
                onPress={() =>
                  openApplicantProfile(
                    applicant
                  )
                }
                activeOpacity={0.85}
              >
                {/* ====================================================
                    PROFILE IMAGE
                ==================================================== */}

                <View
                  style={
                    styles.profileImageContainer
                  }
                >
                  {applicant.profileImage ? (
                    <Image
                      source={{
                        uri:
                          applicant.profileImage,
                      }}
                      style={
                        styles.profileImage
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.profilePlaceholder
                      }
                    >
                      <Ionicons
                        name="person"
                        size={28}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </View>

                {/* ====================================================
                    APPLICANT INFORMATION
                ==================================================== */}

                <View
                  style={
                    styles.applicantInfo
                  }
                >
                  <View
                    style={
                      styles.nameRow
                    }
                  >
                    <Text
                      style={
                        styles.applicantName
                      }
                      numberOfLines={1}
                    >
                      {
                        applicant.fullName
                      }
                    </Text>

                    {applicant.isVerified ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={17}
                        color={BLUE}
                        style={
                          styles.verifiedIcon
                        }
                      />
                    ) : null}
                  </View>

                  {/* JOB */}

                  {applicant.jobTitle ? (
                    <View
                      style={
                        styles.infoRow
                      }
                    >
                      <Ionicons
                        name="briefcase-outline"
                        size={14}
                        color="#718096"
                      />

                      <Text
                        style={
                          styles.infoText
                        }
                        numberOfLines={1}
                      >
                        {
                          applicant.jobTitle
                        }
                      </Text>
                    </View>
                  ) : null}

                  {/* LOCATION */}

                  {applicant.barangay ? (
                    <View
                      style={
                        styles.infoRow
                      }
                    >
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#718096"
                      />

                      <Text
                        style={
                          styles.infoText
                        }
                        numberOfLines={1}
                      >
                        {
                          applicant.barangay
                        }
                      </Text>
                    </View>
                  ) : null}

                  {/* DATE */}

                  <View
                    style={
                      styles.infoRow
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#718096"
                    />

                    <Text
                      style={
                        styles.infoText
                      }
                    >
                      Applied{' '}
                      {formatDate(
                        applicant.appliedAt
                      )}
                    </Text>
                  </View>

                  {/* STATUS */}

                  <View
                    style={
                      styles.statusRow
                    }
                  >
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(
                              applicant.status
                            ) +
                            '18',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              getStatusColor(
                                applicant.status
                              ),
                          },
                        ]}
                      >
                        {
                          applicant.status
                        }
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ====================================================
                    ARROW
                ==================================================== */}

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9AA6B2"
                />
              </TouchableOpacity>
            )
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 14,
      backgroundColor:
        '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        LIGHT_BLUE,
    },

    headerTextContainer: {
      flex: 1,
      marginLeft: 12,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: DARK_BLUE,
    },

    headerSubtitle: {
      fontSize: 12,
      color: '#718096',
      marginTop: 2,
    },

    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#F4F9FD',
      marginLeft: 8,
    },

    /*
    |--------------------------------------------------------------------------
    | EMPLOYER CARD
    |--------------------------------------------------------------------------
    */

    employerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 16,
      padding: 15,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        BORDER,
    },

    employerIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        LIGHT_BLUE,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 12,
    },

    employerInfo: {
      flex: 1,
    },

    employerLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: '#81909F',
      letterSpacing: 1,
    },

    employerCount: {
      fontSize: 16,
      fontWeight: '800',
      color: DARK_BLUE,
      marginTop: 3,
    },

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 12,
      padding: 13,
      backgroundColor:
        '#FFF1F1',
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#F5CCCC',
    },

    errorText: {
      flex: 1,
      marginLeft: 9,
      fontSize: 13,
      color: '#B71C1C',
      lineHeight: 18,
    },

    /*
    |--------------------------------------------------------------------------
    | SCROLL
    |--------------------------------------------------------------------------
    */

    scroll: {
      flex: 1,
    },

    scrollContent: {
      padding: 16,
      paddingBottom: 35,
    },

    /*
    |--------------------------------------------------------------------------
    | APPLICANT CARD
    |--------------------------------------------------------------------------
    */

    applicantCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        BORDER,
      padding: 14,
      marginBottom: 12,
    },

    profileImageContainer: {
      width: 58,
      height: 58,
      borderRadius: 29,
      overflow: 'hidden',
      marginRight: 13,
    },

    profileImage: {
      width: '100%',
      height: '100%',
    },

    profilePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: BLUE,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    applicantInfo: {
      flex: 1,
    },

    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },

    applicantName: {
      flexShrink: 1,
      fontSize: 15,
      fontWeight: '800',
      color: DARK_BLUE,
    },

    verifiedIcon: {
      marginLeft: 5,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },

    infoText: {
      flex: 1,
      fontSize: 11,
      color: '#718096',
      marginLeft: 5,
    },

    statusRow: {
      flexDirection: 'row',
      marginTop: 7,
    },

    statusBadge: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    statusText: {
      fontSize: 10,
      fontWeight: '800',
    },

    /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

    emptyContainer: {
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 30,
      paddingTop: 65,
    },

    emptyIcon: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor:
        LIGHT_BLUE,
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 18,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: DARK_BLUE,
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      color: '#718096',
    },

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 12,
      fontSize: 13,
      color: '#718096',
    },
  });