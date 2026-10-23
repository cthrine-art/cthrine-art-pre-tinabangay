import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const NAVY = '#0F1F3D';
const BLUE = '#1D4ED8';
const LIGHT_BLUE = '#EEF4FF';

export default function EmployerSettings() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId?: string;
  }>();

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [passwordModalVisible, setPasswordModalVisible] =
    useState(false);


  const goTo = (pathname: string) => {
    router.push({
      pathname: pathname as any,
      params: {
        userId,
        role: 'Employer',
      },
    });
  };



  /* ---------------------------------------------
     LOGOUT
  --------------------------------------------- */

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chevron-back"
              size={23}
              color={NAVY}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Settings
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>
          ACCOUNT
        </Text>

        <View style={styles.card}>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => goTo('/employer/account')}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={BLUE}
              />
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Account
              </Text>

              <Text style={styles.menuDescription}>
                View and manage your personal information
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#C5C9CD"
            />
          </TouchableOpacity>

        </View>

        {/* PREFERENCES */}
        <Text style={styles.sectionTitle}>
          PREFERENCES
        </Text>

        <View style={styles.card}>

          {/* NOTIFICATIONS */}
          <View style={styles.menuRow}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="notifications-outline"
                size={21}
                color={BLUE}
              />
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Notifications
              </Text>

              <Text style={styles.menuDescription}>
                Receive job and account notifications
              </Text>
            </View>

            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: '#D9DEE2',
                true: '#AFC5F5',
              }}
              thumbColor={
                notificationsEnabled
                  ? BLUE
                  : '#FFFFFF'
              }
            />
          </View>

          <View style={styles.divider} />

          {/* AVAILABILITY */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              goTo('/employer/availability')
            }
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="radio-button-on"
                size={21}
                color={BLUE}
              />
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Availability
              </Text>

              <Text style={styles.menuDescription}>
                Manage your availability for posting jobs
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#C5C9CD"
            />
          </TouchableOpacity>

        </View>


        {/* SUPPORT */}
        <Text style={styles.sectionTitle}>
          SUPPORT
        </Text>

        <View style={styles.card}>

          {/* HELP */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              Alert.alert(
                'Help & Support',
                'For assistance, please contact the Tinabangay administrator.'
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="help-circle-outline"
                size={21}
                color={BLUE}
              />
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Help & Support
              </Text>

              <Text style={styles.menuDescription}>
                Get help using Tinabangay
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#C5C9CD"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ABOUT */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              Alert.alert(
                'About Tinabangay',
                'Tinabangay\nVersion 1.0.0'
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={BLUE}
              />
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                About Tinabangay
              </Text>

              <Text style={styles.menuDescription}>
                Learn more about the application
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#C5C9CD"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* PRIVACY */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'The Privacy Policy will be available soon.'
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color={BLUE}
              />
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Privacy Policy
              </Text>

              <Text style={styles.menuDescription}>
                Learn how your information is handled
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#C5C9CD"
            />
          </TouchableOpacity>

        </View>

        {/* APP INFO */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            Tinabangay
          </Text>

          <Text style={styles.versionNumber}>
            Version 1.0.0
          </Text>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#D32F2F"
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setPasswordModalVisible(false)
        }
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.passwordModal}>

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Change Password
                </Text>

                <Text style={styles.modalSubtitle}>
                  Keep your account secure
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setPasswordModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
  },

  headerSpacer: {
    width: 40,
  },

  /* SECTIONS */
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A7F84',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },

  /* CARD */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEAE4',
    overflow: 'hidden',
    marginBottom: 22,
  },

  /* MENU ROW */
  menuRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F1F2',
    marginLeft: 76,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuContent: {
    flex: 1,
    paddingRight: 10,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
  },

  menuDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: '#7A8289',
    marginTop: 3,
  },

  /* VERSION */
  versionContainer: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 18,
  },

  versionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8F94',
  },

  versionNumber: {
    fontSize: 10,
    color: '#A0A5A9',
    marginTop: 3,
  },

  /* LOGOUT */
  logoutButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0CACA',
    backgroundColor: '#FFF7F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  /* PASSWORD MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  passwordModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
  },

  modalSubtitle: {
    fontSize: 11,
    color: '#7A8289',
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  passwordGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#59666F',
    marginBottom: 7,
  },

  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E1E5E7',
    borderRadius: 12,
    backgroundColor: '#FAFBFB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  passwordTextInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 14,
    color: '#333333',
  },

  passwordHint: {
    fontSize: 10,
    color: '#8A8F94',
    marginTop: 5,
  },

  changePasswordButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  cancelButton: {
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  cancelText: {
    color: '#70777C',
    fontSize: 14,
    fontWeight: '600',
  },
});

