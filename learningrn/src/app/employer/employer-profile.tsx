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
const ACCENT = '#1D4ED8';
const BACKGROUND = '#FAF7F2';

export default function EmployerProfileScreen() {
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
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

      const response = await fetch(
        `${API_BASE_URL}/get-profile.php?userId=${encodeURIComponent(
          userId
        )}`
      );

      const responseText = await response.text();

      console.log(
        'EMPLOYER PROFILE RAW:',
        responseText
      );

      let data: any = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server did not return valid JSON. Response: ${responseText}`
        );
      }

      console.log(
        'EMPLOYER PROFILE DATA:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to load employer profile.'
        );
      }

      if (
        data.success === false ||
        data.status === 'error'
      ) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to load employer profile.'
        );
      }

      setFullName(data.fullName || '');
      setEmail(data.email || '');
      setMobileNo(data.mobileNo || '');

      setIsVerified(
        data.isVerified === true ||
          data.isVerified === 1 ||
          data.isVerified === '1'
      );
    } catch (error: any) {
      console.log(
        'Employer profile loading error:',
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
  // PROFILE COMPLETION
  // =========================================================

  const getCompletionPercentage = () => {
    const fields = [
      fullName.trim(),
      email.trim(),
      mobileNo.trim(),
    ];

    const completed = fields.filter(
      (value) => value !== ''
    ).length;

    return Math.round(
      (completed / fields.length) * 100
    );
  };

  const completionPercentage =
    getCompletionPercentage();

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSave = async () => {
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanMobileNo = mobileNo.trim();

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
        userId: userId,
        fullName: cleanFullName,
        email: cleanEmail,
        mobileNo: cleanMobileNo,
      };

      console.log(
        'EMPLOYER UPDATE PROFILE REQUEST:',
        requestBody
      );

      const response = await fetch(
        `${API_BASE_URL}/update-profile.php`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },

          body: JSON.stringify(requestBody),
        }
      );

      const responseText =
        await response.text();

      console.log(
        'EMPLOYER UPDATE PROFILE RAW:',
        responseText
      );

      let data: any = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        console.log(
          'Employer update response was not JSON.'
        );
      }

      console.log(
        'EMPLOYER UPDATE PROFILE RESPONSE:',
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
        'Your employer profile has been successfully updated.',
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
        'Employer profile update error:',
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
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator
            size="large"
            color={ACCENT}
          />

          <Text style={styles.loadingText}>
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={NAVY}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            My Profile
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* =================================================
            PROFILE SUMMARY
        ================================================= */}

        <View style={styles.profileCard}>

          <View
            style={[
              styles.profileIcon,
              {
                backgroundColor: '#EFF6FF',
              },
            ]}
          >
            <Ionicons
              name="person"
              size={28}
              color={ACCENT}
            />
          </View>

          <View style={styles.profileInfo}>

            <Text
              style={styles.profileName}
              numberOfLines={1}
            >
              {fullName || 'Your Name'}
            </Text>

            <Text
              style={[
                styles.profileRole,
                {
                  color: ACCENT,
                },
              ]}
            >
              EMPLOYER
            </Text>

          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isVerified
                  ? '#ECFDF3'
                  : '#FFF7ED',
              },
            ]}
          >

            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isVerified
                    ? '#16A34A'
                    : '#F59E0B',
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: isVerified
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

        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage ? (
          <View style={styles.errorBox}>

            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#DC2626"
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>

          </View>
        ) : null}

        {/* =================================================
            PROFILE COMPLETION
        ================================================= */}

        <Text style={styles.sectionTitle}>
          PROFILE COMPLETION
        </Text>

        <View style={styles.completionCard}>

          <View
            style={[
              styles.completionIcon,
              {
                backgroundColor:
                  completionPercentage === 100
                    ? '#ECFDF3'
                    : '#EFF6FF',
              },
            ]}
          >
            <Ionicons
              name={
                completionPercentage === 100
                  ? 'checkmark-circle'
                  : 'person-outline'
              }
              size={22}
              color={
                completionPercentage === 100
                  ? '#16A34A'
                  : ACCENT
              }
            />
          </View>

          <View style={styles.completionContent}>

            <Text
              style={styles.completionTitle}
            >
              {completionPercentage === 100
                ? 'Profile complete'
                : 'Complete your profile'}
            </Text>

            <Text
              style={styles.completionDescription}
            >
              {completionPercentage === 100
                ? 'Your employer profile is ready to use.'
                : 'Add your personal information so workers can identify you.'}
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
                    backgroundColor: ACCENT,
                  },
                ]}
              />
            </View>

            <Text
              style={styles.progressText}
            >
              {completionPercentage}% complete
            </Text>

          </View>
        </View>

        {/* =================================================
            PERSONAL INFORMATION
        ================================================= */}

        <Text style={styles.sectionTitle}>
          PERSONAL INFORMATION
        </Text>

        <View style={styles.formCard}>

          {/* FULL NAME */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Full name
            </Text>

            <View
              style={styles.inputWrapper}
            >
              <Ionicons
                name="person-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>

          </View>

          {/* EMAIL */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Email address
            </Text>

            <View
              style={styles.inputWrapper}
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

          </View>

          {/* MOBILE */}

          <View
            style={styles.inputGroupLast}
          >

            <Text style={styles.inputLabel}>
              Mobile number
            </Text>

            <View
              style={styles.inputWrapper}
            >
              <Ionicons
                name="call-outline"
                size={19}
                color="#9CA3AF"
              />

              <TextInput
                value={mobileNo}
                onChangeText={setMobileNo}
                placeholder="Enter your mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

          </View>

        </View>

        {/* =================================================
            SAVE
        ================================================= */}

        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: ACCENT,
            },
            saving && styles.disabledButton,
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

              <Text style={styles.saveText}>
                Save changes
              </Text>
            </>
          )}

        </TouchableOpacity>

        {/* =================================================
            ACCOUNT STATUS
        ================================================= */}

        <Text style={styles.sectionTitle}>
          ACCOUNT STATUS
        </Text>

        <View
          style={styles.verificationCard}
        >

          <View
            style={[
              styles.verificationIcon,
              {
                backgroundColor: isVerified
                  ? '#ECFDF3'
                  : '#EFF6FF',
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
                  : ACCENT
              }
            />

          </View>

          <View
            style={styles.verificationContent}
          >

            <Text
              style={styles.verificationTitle}
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
                ? 'Your employer account has been successfully verified.'
                : 'Your employer account is currently awaiting verification.'}
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

  // =======================================================
  // HEADER
  // =======================================================

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

  // =======================================================
  // PROFILE CARD
  // =======================================================

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

  // =======================================================
  // ERROR
  // =======================================================

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

  // =======================================================
  // SECTION
  // =======================================================

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: '#8A8F98',
    marginBottom: 9,
    marginLeft: 3,
  },

  // =======================================================
  // COMPLETION
  // =======================================================

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
    borderRadius: 10,
  },

  progressText: {
    fontSize: 10,
    color: '#7A8089',
    marginTop: 5,
    fontWeight: '600',
  },

  // =======================================================
  // FORM
  // =======================================================

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

  // =======================================================
  // SAVE
  // =======================================================

  saveButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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

  // =======================================================
  // VERIFICATION
  // =======================================================

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
