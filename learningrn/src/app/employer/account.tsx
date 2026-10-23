import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
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

// Role-based accent colors
const ACCENT_COLORS: Record<string, string> = {
  Worker: '#2E7D32',
  Employer: '#1D4ED8',
  Admin: '#0F766E',
};

export default function EmployerAccountScreen() {
  const router = useRouter();

  const { userId, role } = useLocalSearchParams<{
    userId?: string;
    role?: string;
  }>();

  // Employer uses blue accent
  const accent = ACCENT_COLORS[role as string] || ACCENT_COLORS.Employer;

  const [fullName, setFullName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setErrorMessage(
          'No user ID was passed to this screen — please log in again.'
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/get-profile.php?userId=${userId}`
        );

        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.error || 'Failed to load account.');
          return;
        }

        setFullName(data.fullName || '');
        setIsVerified(data.isVerified);
      } catch (err) {
        setErrorMessage('Could not reach the server.');
        console.log('Employer account fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const goTo = (pathname: string) => {
    router.push({
      pathname,
      params: {
        userId,
        role: role || 'Employer',
      },
    } as any);
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log out?',
      'You will need to log in again to continue.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => router.replace('/login'),
        },
      ]
    );
  };

  const rows: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    trailing?: string;
  }[] = [
    {
      label: 'Edit profile',
      icon: 'person-outline',
      onPress: () => goTo('/employer/employer-profile'),
    },
    {
      label: 'Change password',
      icon: 'lock-closed-outline',
      onPress: () => goTo('/employer/change-password'),
    },
    {
      label: 'Verification status',
      icon: 'shield-checkmark-outline',
      onPress: () => {},
      trailing: isVerified ? 'Verified' : 'Pending',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={NAVY}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Image
              source={require('../../../assets/tinabangay-logo.png')}
              style={styles.avatar}
              resizeMode="contain"
            />

            <View>
              <Text style={styles.userName}>
                {fullName || 'Account'}
              </Text>

              <Text
                style={[
                  styles.accountLabel,
                  { color: accent },
                ]}
              >
                ACCOUNT
              </Text>
            </View>
          </View>

          {/* Notification button */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() =>
              router.push({
                pathname: '/employer/notifications',
                params: { userId },
              } as any)
            }
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={NAVY}
            />
          </TouchableOpacity>
        </View>

        {/* ERROR */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color="#DC2626"
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* ACCOUNT OPTIONS */}
        <View style={styles.list}>
          {rows.map((row, index) => (
            <TouchableOpacity
              key={row.label}
              style={[
                styles.row,
                index !== rows.length - 1 && styles.rowDivider,
              ]}
              onPress={row.onPress}
              disabled={row.label === 'Verification status'}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View
                style={[
                  styles.rowIconWrap,
                  {
                    backgroundColor: `${accent}1A`,
                  },
                ]}
              >
                <Ionicons
                  name={row.icon}
                  size={18}
                  color={accent}
                />
              </View>

              {/* Label */}
              <Text style={styles.rowLabel}>
                {row.label}
              </Text>

              {/* Trailing */}
              {row.trailing ? (
                <Text
                  style={[
                    styles.rowTrailing,
                    {
                      color:
                        row.trailing === 'Verified'
                          ? '#2E7D32'
                          : '#B45309',
                    },
                  ]}
                >
                  {row.trailing}
                </Text>
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#D1D5DB"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* LOG OUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={confirmLogout}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={19}
            color="#DC2626"
            style={styles.logoutIcon}
          />

          <Text style={styles.logoutText}>
            Log out
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

  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 20,
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 4,
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },

  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
  },

  accountLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ERROR */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },

  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },

  /* ACCOUNT LIST */
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
  },

  rowTrailing: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* LOGOUT */
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  logoutIcon: {
    marginRight: 8,
  },

  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});