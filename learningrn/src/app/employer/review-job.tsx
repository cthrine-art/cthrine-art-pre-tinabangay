import React, { useState } from 'react';

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

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';


// ======================================================
// API
// ======================================================

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';


// ======================================================
// SCREEN
// ======================================================

export default function ReviewJobScreen() {

  const router = useRouter();

  // ----------------------------------------------------
  // ROUTE PARAMETERS
  // ----------------------------------------------------

  const params = useLocalSearchParams<{
    userId?: string;
    fullName?: string;

    title?: string;
    categoryId?: string;
    categoryName?: string;

    requiredSkills?: string;

    schedule?: string;

    budget?: string;

    description?: string;

    jobType?: string;

    location?: string;
    landmark?: string;

    latitude?: string;
    longitude?: string;
  }>();


  // ----------------------------------------------------
  // EMPLOYER INFORMATION
  // ----------------------------------------------------

  const userId = params.userId
    ? String(params.userId)
    : '';

  const fullName = params.fullName
    ? String(params.fullName)
    : 'Employer';


  // ----------------------------------------------------
  // JOB INFORMATION
  // ----------------------------------------------------

  const title = params.title
    ? String(params.title)
    : '';

  const categoryId = params.categoryId
    ? String(params.categoryId)
    : '';

  const categoryName = params.categoryName
    ? String(params.categoryName)
    : '';

  const requiredSkills =
    params.requiredSkills
      ? String(params.requiredSkills)
      : '';

  const schedule = params.schedule
    ? String(params.schedule)
    : '';

  const budget = params.budget
    ? String(params.budget)
    : '';

  const description =
    params.description
      ? String(params.description)
      : '';

  const jobType = params.jobType
    ? String(params.jobType)
    : 'One-time';

  const location = params.location
    ? String(params.location)
    : '';

  const landmark = params.landmark
    ? String(params.landmark)
    : '';

  const latitude = params.latitude
    ? String(params.latitude)
    : '';

  const longitude = params.longitude
    ? String(params.longitude)
    : '';


  // ----------------------------------------------------
  // STATE
  // ----------------------------------------------------

  const [submitting, setSubmitting] =
    useState(false);


  // ====================================================
  // FORMAT BUDGET
  // ====================================================

  const formattedBudget =
    budget
      ? `₱${Number(budget).toLocaleString(
          'en-PH',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`
      : 'Not specified';


  // ====================================================
  // POST JOB
  // ====================================================

  const handlePostJob = async () => {

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!userId) {
      Alert.alert(
        'Missing Employer Information',
        'Your employer ID was not found. Please go back and try again.'
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        'Missing Job Title',
        'Please provide a job title.'
      );
      return;
    }

    if (!categoryId) {
      Alert.alert(
        'Missing Category',
        'Please select a job category.'
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Missing Description',
        'Please provide a job description.'
      );
      return;
    }

    if (!budget || Number(budget) <= 0) {
      Alert.alert(
        'Invalid Budget',
        'Please provide a valid budget.'
      );
      return;
    }

    if (!location.trim()) {
      Alert.alert(
        'Missing Location',
        'Please provide the job location.'
      );
      return;
    }


    // --------------------------------------------------
    // START SUBMITTING
    // --------------------------------------------------

    setSubmitting(true);

    try {

      // ------------------------------------------------
      // REQUIRED SKILLS
      // ------------------------------------------------

      let skillsToSend: string[] = [];

      if (requiredSkills.trim()) {

        skillsToSend =
          requiredSkills
            .split(',')
            .map(
              (skill) =>
                skill.trim()
            )
            .filter(
              (skill) =>
                skill.length > 0
            );

      }


      // ------------------------------------------------
      // LATITUDE / LONGITUDE
      // ------------------------------------------------

      const parsedLatitude =
        latitude.trim()
          ? Number(latitude)
          : null;

      const parsedLongitude =
        longitude.trim()
          ? Number(longitude)
          : null;


      // ------------------------------------------------
      // REQUEST BODY
      // ------------------------------------------------

      const requestBody = {
        userId: Number(userId),

        title: title.trim(),

        categoryId:
          Number(categoryId),

        description:
          description.trim(),

        budget:
          Number(budget),

        location:
          location.trim(),

        latitude:
          parsedLatitude,

        longitude:
          parsedLongitude,

        jobType:
          jobType === 'Recurring'
            ? 'Recurring'
            : 'One-time',

        requiredSkills:
          skillsToSend,
      };


      console.log(
        'CREATE JOB REQUEST:',
        requestBody
      );


      // ------------------------------------------------
      // SEND TO PHP
      // ------------------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/create-job.php`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );


      // ------------------------------------------------
      // READ SERVER RESPONSE
      // ------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        'CREATE JOB RESPONSE:',
        responseText
      );


      let data: any;

      try {

        data =
          JSON.parse(
            responseText
          );

      } catch {

        throw new Error(
          `The server returned an invalid response.\n\n${responseText}`
        );

      }


      // ------------------------------------------------
      // CHECK RESPONSE
      // ------------------------------------------------

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.error ||
          data.message ||
          'Unable to post the job.'
        );

      }


      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      Alert.alert(
        'Job Posted Successfully',
        'Your job has been posted and is now available to workers.',
        [
          {
            text: 'View My Jobs',

            onPress: () => {

              router.replace({
                pathname:
                  '/employer/my-jobs',

                params: {
                  userId:
                    String(userId),

                  fullName:
                    String(fullName),
                },
              });

            },
          },
        ],
        {
          cancelable: false,
        }
      );

    } catch (error: any) {

      console.error(
        'CREATE JOB ERROR:',
        error
      );

      Alert.alert(
        'Unable to Post Job',
        error?.message ||
          'Something went wrong while posting your job.'
      );

    } finally {

      setSubmitting(false);

    }

  };


  // ====================================================
  // BACK
  // ====================================================

  const handleBack = () => {

    if (submitting) {
      return;
    }

    router.back();

  };


  // ====================================================
  // UI
  // ====================================================

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
          styles.contentContainer
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}

        <View
          style={styles.header}
        >

          <Pressable
            style={
              styles.backButton
            }
            onPress={handleBack}
            disabled={submitting}
          >

            <Text
              style={styles.backIcon}
            >
              ‹
            </Text>

          </Pressable>


          <View
            style={styles.headerText}
          >

            <Text
              style={styles.headerTitle}
            >
              Review Job
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Check your details before posting
            </Text>

          </View>

        </View>


        {/* ========================================== */}
        {/* JOB PREVIEW */}
        {/* ========================================== */}

        <View
          style={styles.card}
        >

          <Text
            style={styles.cardTitle}
          >
            Job Details
          </Text>


          {/* JOB TITLE */}

          <View
            style={styles.detailBlock}
          >

            <Text
              style={styles.label}
            >
              Job Title
            </Text>

            <Text
              style={styles.value}
            >
              {title || 'Not specified'}
            </Text>

          </View>


          {/* CATEGORY */}

          <View
            style={styles.detailBlock}
          >

            <Text
              style={styles.label}
            >
              Category
            </Text>

            <Text
              style={styles.value}
            >
              {categoryName ||
                'Not specified'}
            </Text>

          </View>


          {/* JOB TYPE */}

          <View
            style={styles.detailBlock}
          >

            <Text
              style={styles.label}
            >
              Job Type
            </Text>

            <Text
              style={styles.value}
            >
              {jobType}
            </Text>

          </View>


          {/* SCHEDULE */}

          <View
            style={styles.detailBlock}
          >

            <Text
              style={styles.label}
            >
              Schedule
            </Text>

            <Text
              style={styles.value}
            >
              {schedule ||
                'Not specified'}
            </Text>

          </View>


          {/* BUDGET */}

          <View
            style={styles.detailBlock}
          >

            <Text
              style={styles.label}
            >
              Budget
            </Text>

            <Text
              style={[
                styles.value,
                styles.budgetValue,
              ]}
            >
              {formattedBudget}
            </Text>

          </View>


          {/* LOCATION */}

          <View
            style={styles.detailBlock}
          >

            <Text
              style={styles.label}
            >
              Job Location
            </Text>

            <Text
              style={styles.value}
            >
              {location ||
                'Not specified'}
            </Text>

          </View>


          {/* LANDMARK */}

          {landmark ? (

            <View
              style={styles.detailBlock}
            >

              <Text
                style={styles.label}
              >
                Landmark
              </Text>

              <Text
                style={styles.value}
              >
                {landmark}
              </Text>

            </View>

          ) : null}


          {/* COORDINATES */}

          {(latitude ||
            longitude) ? (

            <View
              style={styles.coordinatesBox}
            >

              <Text
                style={
                  styles.coordinatesTitle
                }
              >
                Location Coordinates
              </Text>

              <Text
                style={
                  styles.coordinatesText
                }
              >
                Latitude: {latitude || '—'}
              </Text>

              <Text
                style={
                  styles.coordinatesText
                }
              >
                Longitude: {longitude || '—'}
              </Text>

            </View>

          ) : null}

        </View>


        {/* ========================================== */}
        {/* DESCRIPTION */}
        {/* ========================================== */}

        <View
          style={styles.card}
        >

          <Text
            style={styles.cardTitle}
          >
            Job Description
          </Text>

          <Text
            style={styles.description}
          >
            {description ||
              'No description provided.'}
          </Text>

        </View>


        {/* ========================================== */}
        {/* REQUIRED SKILLS */}
        {/* ========================================== */}

        <View
          style={styles.card}
        >

          <Text
            style={styles.cardTitle}
          >
            Required Skills
          </Text>


          {requiredSkills.trim() ? (

            <View
              style={styles.skillsContainer}
            >

              {requiredSkills
                .split(',')
                .map(
                  (skill) =>
                    skill.trim()
                )
                .filter(
                  (skill) =>
                    skill.length > 0
                )
                .map(
                  (skill, index) => (

                    <View
                      key={`${skill}-${index}`}
                      style={
                        styles.skillBadge
                      }
                    >

                      <Text
                        style={
                          styles.skillText
                        }
                      >
                        {skill}
                      </Text>

                    </View>

                  )
                )}

            </View>

          ) : (

            <Text
              style={
                styles.noSkillsText
              }
            >
              No specific skills listed.
            </Text>

          )}

        </View>


        {/* ========================================== */}
        {/* POST BUTTON */}
        {/* ========================================== */}

        <View
          style={styles.bottomSection}
        >

          <Text
            style={styles.readyText}
          >
            Everything looks good?
          </Text>


          <Pressable
            style={[
              styles.postButton,
              submitting &&
                styles.postButtonDisabled,
            ]}
            onPress={
              handlePostJob
            }
            disabled={submitting}
          >

            {submitting ? (

              <>

                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.postButtonText
                  }
                >
                  Posting Job...
                </Text>

              </>

            ) : (

              <Text
                style={
                  styles.postButtonText
                }
              >
                Post Job
              </Text>

            )}

          </Pressable>


          <Pressable
            style={
              styles.editButton
            }
            onPress={
              handleBack
            }
            disabled={submitting}
          >

            <Text
              style={
                styles.editButtonText
              }
            >
              Edit Job Details
            </Text>

          </Pressable>

        </View>

      </ScrollView>

    </SafeAreaView>

  );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F5FFF9',
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 45,
  },


  // ----------------------------------------------------
  // HEADER
  // ----------------------------------------------------

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


  // ----------------------------------------------------
  // CARD
  // ----------------------------------------------------

  card: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEFE5',
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#183B2D',
    marginBottom: 17,
  },


  // ----------------------------------------------------
  // DETAILS
  // ----------------------------------------------------

  detailBlock: {
    marginBottom: 15,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B8982',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  value: {
    fontSize: 15,
    lineHeight: 21,
    color: '#263F33',
    fontWeight: '600',
  },

  budgetValue: {
    color: '#178A55',
    fontSize: 18,
    fontWeight: '800',
  },


  // ----------------------------------------------------
  // COORDINATES
  // ----------------------------------------------------

  coordinatesBox: {
    marginTop: 2,
    padding: 12,
    backgroundColor: '#F3FAF6',
    borderRadius: 12,
  },

  coordinatesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#527064',
    marginBottom: 5,
  },

  coordinatesText: {
    fontSize: 11,
    color: '#71827A',
    marginTop: 2,
  },


  // ----------------------------------------------------
  // DESCRIPTION
  // ----------------------------------------------------

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#53645B',
  },


  // ----------------------------------------------------
  // SKILLS
  // ----------------------------------------------------

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  skillBadge: {
    backgroundColor: '#E5F7ED',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  skillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#187149',
  },

  noSkillsText: {
    fontSize: 13,
    color: '#7B8982',
  },


  // ----------------------------------------------------
  // BUTTONS
  // ----------------------------------------------------

  bottomSection: {
    marginHorizontal: 20,
    marginTop: 5,
  },

  readyText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#718078',
    marginBottom: 11,
  },

  postButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#178A55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  postButtonDisabled: {
    opacity: 0.65,
  },

  postButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  editButton: {
    minHeight: 48,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#178A55',
    alignItems: 'center',
    justifyContent: 'center',
  },

  editButtonText: {
    color: '#178A55',
    fontSize: 14,
    fontWeight: '800',
  },

});