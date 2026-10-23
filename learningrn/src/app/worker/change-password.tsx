import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#0F1F3D';

const ACCENT_COLORS: Record<string, string> = {
  Worker: '#2E7D32',
  Employer: '#1D4ED8',
  Admin: '#0F766E',
};

// ======================================================
// PASSWORD INPUT
// IMPORTANT: This is OUTSIDE ChangePasswordScreen
// so the TextInput does not remount on every keystroke.
// ======================================================

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  disabled?: boolean;
};

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  setVisible,
  disabled = false,
}: PasswordFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="lock-closed-outline"
          size={19}
          color="#9CA3AF"
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A1A1AA"
          secureTextEntry={!visible}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          textContentType="password"
          importantForAutofill="yes"
        />

        <TouchableOpacity
          onPress={() => setVisible((previous) => !previous)}
          style={styles.eyeButton}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              visible
                ? 'eye-off-outline'
                : 'eye-outline'
            }
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ======================================================
// MAIN SCREEN
// ======================================================

export default function ChangePasswordScreen() {
  const router = useRouter();

  const { userId, role } = useLocalSearchParams<{
    userId?: string;
    role?: string;
  }>();

  const accent =
    ACCENT_COLORS[role as string] || NAVY;

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const passwordValid =
    newPassword.length >= 8;

  const passwordsMatch =
    newPassword.length > 0 &&
    newPassword === confirmPassword;

  // ======================================================
  // CHANGE PASSWORD
  // ======================================================

  const handleChangePassword = async () => {
    if (!userId) {
      Alert.alert(
        'Unable to continue',
        'Your user ID is missing. Please log in again.'
      );
      return;
    }

    if (!currentPassword.trim()) {
      Alert.alert(
        'Current password required',
        'Please enter your current password.'
      );
      return;
    }

    if (!newPassword) {
      Alert.alert(
        'New password required',
        'Please enter your new password.'
      );
      return;
    }

    if (!passwordValid) {
      Alert.alert(
        'Password too short',
        'Your new password must contain at least 8 characters.'
      );
      return;
    }

    if (!passwordsMatch) {
      Alert.alert(
        'Passwords do not match',
        'Please make sure both new password fields are the same.'
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        'Choose a new password',
        'Your new password must be different from your current password.'
      );
      return;
    }

    setSaving(true);

    try {
      const requestBody = {
        userId: userId,
        currentPassword: currentPassword,
        newPassword: newPassword,
      };

      console.log(
        'CHANGE PASSWORD REQUEST:',
        {
          userId,
          currentPassword: '********',
          newPassword: '********',
        }
      );

      const response = await fetch(
        `${API_BASE_URL}/change-password.php`,
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
        'CHANGE PASSWORD RAW RESPONSE:',
        responseText
      );

      let data: any = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        console.log(
          'Server did not return JSON.'
        );
      }

      console.log(
        'CHANGE PASSWORD RESPONSE:',
        data
      );

      if (!response.ok) {
        Alert.alert(
          'Unable to change password',
          data.error ||
            data.message ||
            responseText ||
            'The server could not change your password.'
        );
        return;
      }

      if (
        data.success === false ||
        data.status === 'error'
      ) {
        Alert.alert(
          'Unable to change password',
          data.error ||
            data.message ||
            'The current password may be incorrect.'
        );
        return;
      }

      Alert.alert(
        'Password updated',
        'Your password has been changed successfully.',
        [
          {
            text: 'Done',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');

              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        'Change password error:',
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

  // ======================================================
  // SCREEN
  // ======================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}

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
            Change Password
          </Text>

          <View style={styles.headerSpacer} />

        </View>

        {/* SECURITY INTRO */}

        <View
          style={[
            styles.introCard,
            {
              backgroundColor:
                `${accent}0D`,
            },
          ]}
        >

          <View
            style={[
              styles.introIcon,
              {
                backgroundColor:
                  `${accent}1A`,
              },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={22}
              color={accent}
            />
          </View>

          <View style={styles.introContent}>

            <Text style={styles.introTitle}>
              Keep your account secure
            </Text>

            <Text style={styles.introText}>
              Choose a strong password that
              you don't use for other accounts.
            </Text>

          </View>

        </View>

        {/* PASSWORD SECTION */}

        <Text style={styles.sectionTitle}>
          PASSWORD
        </Text>

        <View style={styles.formCard}>

          <PasswordField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            visible={showCurrent}
            setVisible={setShowCurrent}
            disabled={saving}
          />

          <PasswordField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            visible={showNew}
            setVisible={setShowNew}
            disabled={saving}
          />

          <View style={styles.lastInput}>
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              visible={showConfirm}
              setVisible={setShowConfirm}
              disabled={saving}
            />
          </View>

        </View>

        {/* PASSWORD REQUIREMENTS */}

        <View style={styles.requirementsCard}>

          <Text style={styles.requirementsTitle}>
            Password requirements
          </Text>

          <View style={styles.requirementRow}>

            <Ionicons
              name={
                passwordValid
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              size={17}
              color={
                passwordValid
                  ? '#16A34A'
                  : '#9CA3AF'
              }
            />

            <Text
              style={[
                styles.requirementText,
                passwordValid &&
                  styles.requirementPassed,
              ]}
            >
              At least 8 characters
            </Text>

          </View>

          <View style={styles.requirementRow}>

            <Ionicons
              name={
                passwordsMatch
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              size={17}
              color={
                passwordsMatch
                  ? '#16A34A'
                  : '#9CA3AF'
              }
            />

            <Text
              style={[
                styles.requirementText,
                passwordsMatch &&
                  styles.requirementPassed,
              ]}
            >
              Passwords match
            </Text>

          </View>

          <View style={styles.requirementRow}>

            <Ionicons
              name={
                currentPassword &&
                newPassword &&
                currentPassword !== newPassword
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              size={17}
              color={
                currentPassword &&
                newPassword &&
                currentPassword !== newPassword
                  ? '#16A34A'
                  : '#9CA3AF'
              }
            />

            <Text
              style={[
                styles.requirementText,
                currentPassword &&
                  newPassword &&
                  currentPassword !== newPassword &&
                  styles.requirementPassed,
              ]}
            >
              New password is different
            </Text>

          </View>

        </View>

        {/* UPDATE BUTTON */}

        <TouchableOpacity
          style={[
            styles.changeButton,
            {
              backgroundColor: accent,
            },
            saving && styles.disabledButton,
          ]}
          onPress={handleChangePassword}
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
                  styles.changeButtonText,
                  {
                    marginLeft: 8,
                  },
                ]}
              >
                Updating...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.changeButtonText}>
                Update password
              </Text>
            </>
          )}

        </TouchableOpacity>

        <Text style={styles.securityNote}>
          Your password helps protect your
          Tinabangay account and personal
          information.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 45,
  },

  // HEADER

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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

  // INTRO

  introCard: {
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },

  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  introContent: {
    flex: 1,
    marginLeft: 12,
  },

  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
  },

  introText: {
    fontSize: 11,
    color: '#737983',
    lineHeight: 16,
    marginTop: 3,
  },

  // SECTION

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: '#8A8F98',
    marginLeft: 3,
    marginBottom: 9,
  },

  // FORM

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#F1F1EF',
    marginBottom: 14,
  },

  inputGroup: {
    marginBottom: 16,
  },

  lastInput: {
    marginBottom: -16,
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

  eyeButton: {
    padding: 5,
    marginLeft: 4,
  },

  // REQUIREMENTS

  requirementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F1EF',
    marginBottom: 20,
  },

  requirementsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 11,
  },

  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  requirementText: {
    fontSize: 11,
    color: '#737983',
    marginLeft: 8,
  },

  requirementPassed: {
    color: '#15803D',
  },

  // BUTTON

  changeButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  disabledButton: {
    opacity: 0.65,
  },

  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  securityNote: {
    textAlign: 'center',
    fontSize: 10,
    color: '#9CA3AF',
    lineHeight: 15,
    marginTop: 14,
    paddingHorizontal: 25,
  },
});