import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';
const BACKGROUND = '#FAF7F2';

type Category = {
  categoryId: number;
  categoryName: string;
  description?: string;
};

export default function WorkerProfileScreen() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId?: string;
  }>();

  // =========================================================
  // STATE
  // =========================================================

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');

  const [isVerified, setIsVerified] = useState(false);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [yearsExperience, setYearsExperience] = useState('');
  const [aboutMe, setAboutMe] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) {
      setErrorMessage(
        'No user ID was passed to this screen. Please log in again.'
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const [profileResponse, categoriesResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/get-worker-profile.php?userId=${encodeURIComponent(
              userId
            )}`
          ),

          // IMPORTANT:
          // Use service categories because worker_profile.primary_category_id
          // references service_category.category_id.
          fetch(
            `${API_BASE_URL}/get-service-categories.php`
          ),
        ]);

      const profileData = await profileResponse.json();
      const categoriesData =
        await categoriesResponse.json();

      console.log(
        'WORKER PROFILE:',
        profileData
      );

      console.log(
        'SERVICE CATEGORIES:',
        categoriesData
      );

      if (
        !profileResponse.ok ||
        profileData.success === false
      ) {
        throw new Error(
          profileData.error ||
            'Failed to load worker profile.'
        );
      }

      if (
        !categoriesResponse.ok ||
        categoriesData.success === false
      ) {
        throw new Error(
          categoriesData.error ||
            'Failed to load work categories.'
        );
      }

      // =====================================================
      // PROFILE
      // =====================================================

      setFullName(
        profileData.fullName || ''
      );

      setEmail(
        profileData.email || ''
      );

      setMobileNo(
        profileData.mobileNo || ''
      );

      setIsVerified(
        profileData.isVerified === true ||
          profileData.isVerified === 1 ||
          profileData.isVerified === '1'
      );

      setCategoryId(
        profileData.primaryCategoryId !==
          undefined &&
        profileData.primaryCategoryId !==
          null &&
        profileData.primaryCategoryId !== ''
          ? Number(
              profileData.primaryCategoryId
            )
          : null
      );

      setCategoryName(
        profileData.categoryName || ''
      );

      setYearsExperience(
        profileData.yearsExperience !==
          undefined &&
        profileData.yearsExperience !== null
          ? String(
              profileData.yearsExperience
            )
          : ''
      );

      setAboutMe(
        profileData.aboutMe || ''
      );

      // =====================================================
      // SERVICE CATEGORIES
      // =====================================================

      const serviceCategories =
        Array.isArray(
          categoriesData.categories
        )
          ? categoriesData.categories.map(
              (category: any) => ({
                categoryId: Number(
                  category.id ??
                    category.categoryId ??
                    category.category_id
                ),

                categoryName:
                  category.name ??
                  category.categoryName ??
                  category.category_name ??
                  '',

                description:
                  category.description || '',
              })
            )
          : [];

      console.log(
        'NORMALIZED SERVICE CATEGORIES:',
        serviceCategories
      );

      setCategories(
        serviceCategories
      );
    } catch (error: any) {
      console.log(
        'Worker profile loading error:',
        error
      );

      setErrorMessage(
        error?.message ||
          'Could not reach the server. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CATEGORY
  // =========================================================

  const handleSelectCategory = (
    category: Category
  ) => {
    setCategoryId(
      category.categoryId
    );

    setCategoryName(
      category.categoryName
    );

    setShowCategories(false);
  };

  // =========================================================
  // PROFILE COMPLETION
  // =========================================================

  const getCompletionPercentage = () => {
    const fields = [
      fullName.trim(),
      email.trim(),
      mobileNo.trim(),
      categoryId
        ? String(categoryId)
        : '',
      yearsExperience.trim(),
      aboutMe.trim(),
    ];

    const completed =
      fields.filter(
        (value) => value !== ''
      ).length;

    return Math.round(
      (completed / fields.length) * 100
    );
  };

  const completionPercentage =
    getCompletionPercentage();

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async () => {
    const cleanFullName =
      fullName.trim();

    const cleanEmail =
      email.trim();

    const cleanMobileNo =
      mobileNo.trim();

    const cleanYearsExperience =
      yearsExperience.trim();

    const cleanAboutMe =
      aboutMe.trim();

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!cleanFullName) {
      Alert.alert(
        'Unable to save',
        'Full name is required.'
      );
      return;
    }

    if (!cleanEmail) {
      Alert.alert(
        'Unable to save',
        'Email address is required.'
      );
      return;
    }

    if (!cleanMobileNo) {
      Alert.alert(
        'Unable to save',
        'Mobile number is required.'
      );
      return;
    }

    if (!categoryId) {
      Alert.alert(
        'Complete your profile',
        'Please select your main work category.'
      );
      return;
    }

    if (!cleanYearsExperience) {
      Alert.alert(
        'Complete your profile',
        'Please enter your years of experience.'
      );
      return;
    }

    const parsedYearsExperience =
      Number(cleanYearsExperience);

    if (
      Number.isNaN(
        parsedYearsExperience
      ) ||
      parsedYearsExperience < 0 ||
      parsedYearsExperience > 99
    ) {
      Alert.alert(
        'Invalid experience',
        'Please enter a valid number of years between 0 and 99.'
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        'Unable to save',
        'User ID is missing. Please log in again.'
      );
      return;
    }

    setSaving(true);

    try {
      const requestBody = {
        userId: Number(userId),

        fullName:
          cleanFullName,

        email:
          cleanEmail,

        mobileNo:
          cleanMobileNo,

        categoryId:
          Number(categoryId),

        yearsExperience:
          parsedYearsExperience,

        aboutMe:
          cleanAboutMe,
      };

      console.log(
        'UPDATE WORKER PROFILE:',
        requestBody
      );

      const response =
        await fetch(
          `${API_BASE_URL}/update-worker-profile.php`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body: JSON.stringify(
              requestBody
            ),
          }
        );

      const responseText =
        await response.text();

      console.log(
        'UPDATE WORKER PROFILE RAW:',
        responseText
      );

      let data: any = {};

      try {
        data =
          JSON.parse(
            responseText
          );
      } catch {
        console.log(
          'Server response was not JSON.'
        );
      }

      console.log(
        'UPDATE WORKER PROFILE RESPONSE:',
        data
      );

      if (!response.ok) {
        Alert.alert(
          'Unable to save',
          data.error ||
            data.message ||
            responseText ||
            'Failed to update your profile.'
        );

        return;
      }

      if (
        data.success === false ||
        data.status === 'error'
      ) {
        Alert.alert(
          'Unable to save',
          data.error ||
            data.message ||
            'The server rejected the update.'
        );

        return;
      }

      Alert.alert(
        'Profile updated',
        'Your worker profile has been successfully updated.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        'Worker profile update error:',
        error
      );

      Alert.alert(
        'Connection error',
        'Could not reach the server. Please check your connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.centerFill}
        >
          <ActivityIndicator
            size="large"
            color={GREEN}
          />

          <Text
            style={styles.loadingText}
          >
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================
  // SCREEN
  // =========================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View
          style={styles.header}
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={NAVY}
            />
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            My Profile
          </Text>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        {/* PROFILE SUMMARY */}

        <View
          style={
            styles.profileCard
          }
        >
          <View
            style={[
              styles.profileIcon,
              {
                backgroundColor:
                  '#EAF5EC',
              },
            ]}
          >
            <Ionicons
              name="person"
              size={28}
              color={GREEN}
            />
          </View>

          <View
            style={
              styles.profileInfo
            }
          >
            <Text
              style={
                styles.profileName
              }
              numberOfLines={1}
            >
              {fullName ||
                'Your Name'}
            </Text>

            <Text
              style={
                styles.profileRole
              }
            >
              INFORMAL WORKER
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  isVerified
                    ? '#ECFDF3'
                    : '#FFF7ED',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    isVerified
                      ? '#16A34A'
                      : '#F59E0B',
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    isVerified
                      ? '#15803D'
                      : '#B45309',
                },
              ]}
            >
              {isVerified
                ? 'Verified'
                : 'Pending'}
            </Text>
          </View>
        </View>

        {/* ERROR */}

        {errorMessage ? (
          <View
            style={
              styles.errorBox
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#DC2626"
            />

            <Text
              style={
                styles.errorText
              }
            >
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* PROFILE COMPLETION */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          PROFILE COMPLETION
        </Text>

        <View
          style={
            styles.completionCard
          }
        >
          <View
            style={[
              styles.completionIcon,
              {
                backgroundColor:
                  completionPercentage ===
                  100
                    ? '#ECFDF3'
                    : '#FFF7ED',
              },
            ]}
          >
            <Ionicons
              name={
                completionPercentage ===
                100
                  ? 'checkmark-circle'
                  : 'person-outline'
              }
              size={22}
              color={
                completionPercentage ===
                100
                  ? '#16A34A'
                  : '#D97706'
              }
            />
          </View>

          <View
            style={
              styles.completionContent
            }
          >
            <Text
              style={
                styles.completionTitle
              }
            >
              {completionPercentage ===
              100
                ? 'Profile complete'
                : 'Complete your profile'}
            </Text>

            <Text
              style={
                styles.completionDescription
              }
            >
              {completionPercentage ===
              100
                ? 'Your worker profile is ready for employers to view.'
                : 'Add your work information and introduction so employers can learn more about you.'}
            </Text>

            <View
              style={
                styles.progressBackground
              }
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${completionPercentage}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.progressText
              }
            >
              {completionPercentage}%
              {' '}
              complete
            </Text>
          </View>
        </View>

        {/* PERSONAL INFORMATION */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          PERSONAL INFORMATION
        </Text>

        <View
          style={
            styles.formCard
          }
        >
          {/* FULL NAME */}

          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={
                styles.inputLabel
              }
            >
              Full name
            </Text>

            <View
              style={
                styles.inputWrapper
              }
            >
              <Ionicons
                name="person-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                value={fullName}
                onChangeText={
                  setFullName
                }
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                style={
                  styles.input
                }
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* EMAIL */}

          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={
                styles.inputLabel
              }
            >
              Email address
            </Text>

            <View
              style={
                styles.inputWrapper
              }
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                value={email}
                onChangeText={
                  setEmail
                }
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={
                  styles.input
                }
              />
            </View>
          </View>

          {/* MOBILE */}

          <View
            style={
              styles.inputGroupLast
            }
          >
            <Text
              style={
                styles.inputLabel
              }
            >
              Mobile number
            </Text>

            <View
              style={
                styles.inputWrapper
              }
            >
              <Ionicons
                name="call-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                value={mobileNo}
                onChangeText={
                  setMobileNo
                }
                placeholder="Enter your mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={
                  styles.input
                }
              />
            </View>
          </View>
        </View>

        {/* WORK INFORMATION */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          WORK INFORMATION
        </Text>

        <View
          style={
            styles.formCard
          }
        >
          {/* CATEGORY */}

          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={
                styles.inputLabel
              }
            >
              Main work category
            </Text>

            <TouchableOpacity
              style={
                styles.selectButton
              }
              onPress={() =>
                setShowCategories(
                  !showCategories
                )
              }
              activeOpacity={0.8}
            >
              <View
                style={
                  styles.selectLeft
                }
              >
                <Ionicons
                  name="briefcase-outline"
                  size={19}
                  color="#9CA3AF"
                />

                <Text
                  style={[
                    styles.selectText,
                    !categoryName &&
                      styles.placeholderText,
                  ]}
                >
                  {categoryName ||
                    'Select your main work category'}
                </Text>
              </View>

              <Ionicons
                name={
                  showCategories
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={19}
                color="#6B7280"
              />
            </TouchableOpacity>

            {showCategories ? (
              <View
                style={
                  styles.categoryList
                }
              >
                {categories.length ===
                0 ? (
                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    No work categories
                    available.
                  </Text>
                ) : (
                  categories.map(
                    (category) => (
                      <TouchableOpacity
                        key={
                          category.categoryId
                        }
                        style={[
                          styles.categoryOption,
                          categoryId ===
                            category.categoryId &&
                            styles.categoryOptionSelected,
                        ]}
                        onPress={() =>
                          handleSelectCategory(
                            category
                          )
                        }
                      >
                        <View
                          style={
                            styles.categoryOptionContent
                          }
                        >
                          <Text
                            style={[
                              styles.categoryOptionText,
                              categoryId ===
                                category.categoryId &&
                                styles.categoryOptionTextSelected,
                            ]}
                          >
                            {
                              category.categoryName
                            }
                          </Text>

                          {category.description ? (
                            <Text
                              style={
                                styles.categoryDescription
                              }
                            >
                              {
                                category.description
                              }
                            </Text>
                          ) : null}
                        </View>

                        {categoryId ===
                        category.categoryId ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={
                              GREEN
                            }
                          />
                        ) : null}
                      </TouchableOpacity>
                    )
                  )
                )}
              </View>
            ) : null}
          </View>

          {/* YEARS EXPERIENCE */}

          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={
                styles.inputLabel
              }
            >
              Years of experience
            </Text>

            <View
              style={
                styles.inputWrapper
              }
            >
              <Ionicons
                name="time-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                value={
                  yearsExperience
                }
                onChangeText={(value) =>
                  setYearsExperience(
                    value.replace(
                      /[^0-9.]/g,
                      ''
                    )
                  )
                }
                placeholder="e.g. 5"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                style={
                  styles.input
                }
              />

              <Text
                style={
                  styles.inputSuffix
                }
              >
                years
              </Text>
            </View>
          </View>

          {/* ABOUT ME */}

          <View
            style={
              styles.inputGroupLast
            }
          >
            <Text
              style={
                styles.inputLabel
              }
            >
              About me
            </Text>

            <View
              style={
                styles.textAreaWrapper
              }
            >
              <TextInput
                value={aboutMe}
                onChangeText={
                  setAboutMe
                }
                placeholder="Tell employers a little about yourself, your experience, and the type of work you do."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                style={
                  styles.textArea
                }
                maxLength={500}
              />
            </View>

            <Text
              style={
                styles.characterCount
              }
            >
              {aboutMe.length}/500
            </Text>
          </View>
        </View>

        {/* SAVE */}

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving &&
              styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={[
                  styles.saveText,
                  {
                    marginLeft: 8,
                  },
                ]}
              >
                Saving...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.saveText
                }
              >
                Save changes
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* ACCOUNT STATUS */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          ACCOUNT STATUS
        </Text>

        <View
          style={
            styles.verificationCard
          }
        >
          <View
            style={[
              styles.verificationIcon,
              {
                backgroundColor:
                  isVerified
                    ? '#ECFDF3'
                    : '#FFF7ED',
              },
            ]}
          >
            <Ionicons
              name={
                isVerified
                  ? 'shield-checkmark'
                  : 'shield-outline'
              }
              size={20}
              color={
                isVerified
                  ? '#16A34A'
                  : '#D97706'
              }
            />
          </View>

          <View
            style={
              styles.verificationContent
            }
          >
            <Text
              style={
                styles.verificationTitle
              }
            >
              {isVerified
                ? 'Account verified'
                : 'Verification pending'}
            </Text>

            <Text
              style={
                styles.verificationDescription
              }
            >
              {isVerified
                ? 'Your identity has been verified. You can now complete your profile and present your work information to employers.'
                : 'Your account is currently awaiting verification.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#7A8089',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 40,
  },

  // HEADER

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NAVY,
  },

  headerSpacer: {
    width: 38,
  },

  // PROFILE CARD

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F1EF',
  },

  profileIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },

  profileRole: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 4,
    color: GREEN,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ERROR

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 13,
    marginBottom: 20,
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 17,
  },

  // SECTION

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: '#8A8F98',
    marginBottom: 9,
    marginLeft: 3,
  },

  // COMPLETION

  completionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F1EF',
    marginBottom: 24,
  },

  completionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completionContent: {
    flex: 1,
    marginLeft: 12,
  },

  completionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },

  completionDescription: {
    fontSize: 11,
    color: '#7A8089',
    marginTop: 3,
    lineHeight: 16,
  },

  progressBackground: {
    height: 7,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: GREEN,
    borderRadius: 10,
  },

  progressText: {
    fontSize: 10,
    color: '#7A8089',
    marginTop: 5,
    fontWeight: '600',
  },

  // FORM

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F1EF',
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputGroupLast: {
    marginBottom: 0,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 7,
  },

  inputWrapper: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: NAVY,
    paddingVertical: 10,
  },

  inputSuffix: {
    fontSize: 11,
    color: '#7A8089',
  },

  // CATEGORY

  selectButton: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  selectText: {
    marginLeft: 9,
    fontSize: 14,
    color: NAVY,
    flex: 1,
  },

  placeholderText: {
    color: '#9CA3AF',
  },

  categoryList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  categoryOption: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1EF',
  },

  categoryOptionSelected: {
    backgroundColor: '#EAF5EC',
  },

  categoryOptionContent: {
    flex: 1,
    marginRight: 8,
  },

  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
  },

  categoryOptionTextSelected: {
    color: GREEN,
  },

  categoryDescription: {
    fontSize: 10,
    color: '#7A8089',
    marginTop: 3,
  },

  emptyText: {
    padding: 14,
    fontSize: 12,
    color: '#7A8089',
    textAlign: 'center',
  },

  // ABOUT ME

  textAreaWrapper: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingTop: 10,
  },

  textArea: {
    flex: 1,
    minHeight: 100,
    fontSize: 13,
    color: NAVY,
    lineHeight: 19,
  },

  characterCount: {
    textAlign: 'right',
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 5,
  },

  // SAVE

  saveButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: GREEN,
    marginBottom: 28,
  },

  disabledButton: {
    opacity: 0.65,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // VERIFICATION

  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F1EF',
  },

  verificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  verificationContent: {
    flex: 1,
    marginLeft: 12,
  },

  verificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },

  verificationDescription: {
    fontSize: 11,
    color: '#7A8089',
    marginTop: 3,
    lineHeight: 16,
  },
});