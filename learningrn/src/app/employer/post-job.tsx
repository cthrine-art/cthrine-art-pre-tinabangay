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
  TextInput,
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
// TYPES
// ======================================================

type Category = {
  categoryId: number;
  categoryName: string;
  description?: string;
};

// ======================================================
// SCREEN
// ======================================================

export default function PostJobScreen() {
  const router = useRouter();

  // ----------------------------------------------------
  // PARAMETERS
  // ----------------------------------------------------

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

  // ----------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');

  const [jobType, setJobType] =
    useState<'One-time' | 'Recurring'>(
      'One-time'
    );

  const [schedule, setSchedule] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  // ----------------------------------------------------
  // CATEGORY STATE
  // ----------------------------------------------------

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  // ====================================================
  // LOAD CATEGORIES
  // ====================================================

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/get-job-categories.php`
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
            'Unable to load job categories.'
        );
      }

      setCategories(
        Array.isArray(data.categories)
          ? data.categories
          : []
      );
    } catch (error: any) {
      console.error(
        'LOAD CATEGORIES ERROR:',
        error
      );

      Alert.alert(
        'Unable to Load Categories',
        error?.message ||
          'Something went wrong while loading job categories.'
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  // ====================================================
  // SELECT CATEGORY
  // ====================================================

  const selectCategory = (
    category: Category
  ) => {
    setCategoryId(
      String(category.categoryId)
    );

    setCategoryName(
      category.categoryName
    );
  };

  // ====================================================
  // CONTINUE TO LOCATION
  // ====================================================

  const handleContinue = () => {
    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!userId) {
      Alert.alert(
        'Missing Employer Information',
        'Your employer ID was not found. Please return to the dashboard and try again.'
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        'Missing Job Title',
        'Please enter a job title.'
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

    if (!requiredSkills.trim()) {
      Alert.alert(
        'Missing Required Skills',
        'Please enter at least one required skill.'
      );
      return;
    }

    if (!schedule.trim()) {
      Alert.alert(
        'Missing Schedule',
        'Please enter the job schedule.'
      );
      return;
    }

    if (
      !budget.trim() ||
      Number(budget) <= 0
    ) {
      Alert.alert(
        'Invalid Budget',
        'Please enter a valid budget.'
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Missing Description',
        'Please enter a job description.'
      );
      return;
    }

    // --------------------------------------------------
    // GO TO JOB LOCATION
    // --------------------------------------------------

    router.push({
      pathname:
        '/employer/job-location',

      params: {
        // Employer information
        userId: String(userId),
        fullName: String(fullName),

        // Job information
        title: title.trim(),

        categoryId:
          String(categoryId),

        categoryName:
          String(categoryName),

        requiredSkills:
          requiredSkills.trim(),

        schedule:
          schedule.trim(),

        budget:
          budget.trim(),

        description:
          description.trim(),

        jobType:
          jobType,
      },
    });
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
        backgroundColor="#F5FAFE"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ==========================================
            HEADER
        ========================================== */}

        <View
          style={styles.header}
        >
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
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
              Post a Job
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Find the right worker for your job
            </Text>
          </View>
        </View>

        {/* ==========================================
            JOB TITLE
        ========================================== */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.label}
          >
            Job Title
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Example: House Cleaning"
            placeholderTextColor="#9AA8A0"
            style={styles.input}
          />
        </View>

        {/* ==========================================
            CATEGORY
        ========================================== */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.label}
          >
            Job Category
          </Text>

          {loadingCategories ? (
            <View
              style={
                styles.categoryLoading
              }
            >
              <ActivityIndicator
                size="small"
                color="#1769AA"
              />

              <Text
                style={
                  styles.categoryLoadingText
                }
              >
                Loading categories...
              </Text>
            </View>
          ) : categories.length === 0 ? (
            <Text
              style={
                styles.noCategoriesText
              }
            >
              No job categories are available.
            </Text>
          ) : (
            <View
              style={
                styles.categoryContainer
              }
            >
              {categories.map(
                (category) => {
                  const selected =
                    String(
                      category.categoryId
                    ) === categoryId;

                  return (
                    <Pressable
                      key={
                        category.categoryId
                      }
                      style={[
                        styles.categoryButton,
                        selected &&
                          styles.categoryButtonSelected,
                      ]}
                      onPress={() =>
                        selectCategory(
                          category
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          selected &&
                            styles.categoryButtonTextSelected,
                        ]}
                      >
                        {
                          category.categoryName
                        }
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          )}
        </View>

        {/* ==========================================
            REQUIRED SKILLS
        ========================================== */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.label}
          >
            Required Skills
          </Text>

          <TextInput
            value={requiredSkills}
            onChangeText={
              setRequiredSkills
            }
            placeholder="Example: Cleaning, Washing, Organizing"
            placeholderTextColor="#9AA8A0"
            style={[
              styles.input,
              styles.multilineSmall,
            ]}
            multiline
          />

          <Text
            style={styles.helperText}
          >
            Separate multiple skills with commas.
          </Text>
        </View>

        {/* ==========================================
            JOB TYPE
        ========================================== */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.label}
          >
            Job Type
          </Text>

          <View
            style={styles.optionRow}
          >
            <Pressable
              style={[
                styles.optionButton,
                jobType === 'One-time' &&
                  styles.optionButtonSelected,
              ]}
              onPress={() =>
                setJobType(
                  'One-time'
                )
              }
            >
              <Text
                style={[
                  styles.optionText,
                  jobType === 'One-time' &&
                    styles.optionTextSelected,
                ]}
              >
                One-time
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.optionButton,
                jobType === 'Recurring' &&
                  styles.optionButtonSelected,
              ]}
              onPress={() =>
                setJobType(
                  'Recurring'
                )
              }
            >
              <Text
                style={[
                  styles.optionText,
                  jobType === 'Recurring' &&
                    styles.optionTextSelected,
                ]}
              >
                Recurring
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ==========================================
            SCHEDULE
        ========================================== */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.label}
          >
            Schedule
          </Text>

          <TextInput
            value={schedule}
            onChangeText={setSchedule}
            placeholder="Example: Monday to Friday, 8:00 AM - 5:00 PM"
            placeholderTextColor="#9AA8A0"
            style={styles.input}
          />

          <Text
            style={styles.helperText}
          >
            Schedule is currently used for the
            job-posting interface. Your current
            jobs table does not store this field.
          </Text>
        </View>

        {/* ==========================================
            BUDGET
        ========================================== */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.label}
          >
            Budget
          </Text>

          <View
            style={
              styles.budgetInputContainer
            }
          >
            <Text
              style={styles.currency}
            >
              ₱
            </Text>

            <TextInput
              value={budget}
              onChangeText={setBudget}
              placeholder="500"
              placeholderTextColor="#9AA8A0"
              keyboardType="decimal-pad"
              style={
                styles.budgetInput
              }
            />
          </View>
        </View>

        {/* ==========================================
            DESCRIPTION
        ========================================== */}

        <View
          style={styles.card}
        >
          <Text
            style={styles.label}
          >
            Job Description
          </Text>

          <TextInput
            value={description}
            onChangeText={
              setDescription
            }
            placeholder="Describe the work, responsibilities, and other important details."
            placeholderTextColor="#9AA8A0"
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ==========================================
            CONTINUE
        ========================================== */}

        <Pressable
          style={
            styles.continueButton
          }
          onPress={handleContinue}
        >
          <Text
            style={
              styles.continueButtonText
            }
          >
            Continue to Location
          </Text>

          <Text
            style={
              styles.continueArrow
            }
          >
            →
          </Text>
        </Pressable>

        <View
          style={styles.bottomSpace}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  // ----------------------------------------------------
  // SCREEN
  // ----------------------------------------------------

  safeArea: {
    flex: 1,
    backgroundColor: '#F5FAFE',
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 35,
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
    backgroundColor: '#E8F3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  backIcon: {
    fontSize: 32,
    color: '#155D8F',
    lineHeight: 34,
    marginTop: -3,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#123B5D',
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#72818C',
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
    borderColor: '#D5E6F2',
  },

  // ----------------------------------------------------
  // LABEL
  // ----------------------------------------------------

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#294B66',
    marginBottom: 9,
  },

  // ----------------------------------------------------
  // INPUT
  // ----------------------------------------------------

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D5E6F2',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#294457',
    backgroundColor: '#FBFDFF',
  },

  multilineSmall: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  descriptionInput: {
    minHeight: 125,
  },

  helperText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: '#7D8A94',
  },

  // ----------------------------------------------------
  // CATEGORY
  // ----------------------------------------------------

  categoryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  categoryLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#71808B',
  },

  noCategoriesText: {
    fontSize: 13,
    color: '#7A8892',
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  categoryButton: {
    borderWidth: 1,
    borderColor: '#C9DDEA',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  categoryButtonSelected: {
    backgroundColor: '#1769AA',
    borderColor: '#1769AA',
  },

  categoryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#45677E',
  },

  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },

  // ----------------------------------------------------
  // JOB TYPE
  // ----------------------------------------------------

  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  optionButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D0E2EF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  optionButtonSelected: {
    backgroundColor: '#E8F3FC',
    borderColor: '#1769AA',
  },

  optionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#647985',
  },

  optionTextSelected: {
    color: '#1769AA',
  },

  // ----------------------------------------------------
  // BUDGET
  // ----------------------------------------------------

  budgetInputContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5E6F2',
    borderRadius: 12,
    backgroundColor: '#FBFDFF',
  },

  currency: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1769AA',
    paddingLeft: 13,
  },

  budgetInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 9,
    fontSize: 15,
    color: '#294457',
  },

  // ----------------------------------------------------
  // CONTINUE
  // ----------------------------------------------------

  continueButton: {
    marginHorizontal: 20,
    marginTop: 3,
    minHeight: 53,
    borderRadius: 14,
    backgroundColor: '#1769AA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  continueArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 9,
  },

  bottomSpace: {
    height: 20,
  },
});