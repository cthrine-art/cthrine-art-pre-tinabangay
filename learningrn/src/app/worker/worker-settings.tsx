import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const GREEN = '#2E7D32';
const LIGHT_GREEN = '#EAF5EC';
const NAVY = '#162C3D';

export default function WorkerSettings() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId?: string;
  }>();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const goTo = (pathname: string) => {
    router.push({
      pathname: pathname as any,
      params: {
        userId,
        role: 'Worker',
      },
    });
  };

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
            onPress={() => goTo('/worker/account')}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={GREEN}
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
                color={GREEN}
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
                true: '#A9D2B0',
              }}
              thumbColor={
                notificationsEnabled
                  ? GREEN
                  : '#FFFFFF'
              }
            />
          </View>

          {/* AVAILABILITY */}
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              goTo('/worker/worker-availability')
            }
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="radio-button-on"
                size={21}
                color={GREEN}
              />
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Availability
              </Text>

              <Text style={styles.menuDescription}>
                Manage whether you are available for work
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
                color={GREEN}
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
                color={GREEN}
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
                color={GREEN}
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

  /* SECTION */

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

  /* ROW */

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
    backgroundColor: LIGHT_GREEN,
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
});