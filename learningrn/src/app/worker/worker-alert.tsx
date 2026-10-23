import React, { useCallback, useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#0F1F3D';

type Notification = {
  notificationId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function AlertsScreen() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId?: string;
  }>();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setErrorMessage(
        'No user ID was passed to this screen — please log in again.'
      );
      setLoading(false);
      return;
    }

    setErrorMessage('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/get-notifications.php?userId=${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.error || 'Failed to load notifications.'
        );
        return;
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      setErrorMessage('Could not reach the server.');
      console.log('Notifications fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId
          ? { ...n, isRead: true }
          : n
      )
    );

    try {
      await fetch(
        `${API_BASE_URL}/mark-notification-read.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId,
          }),
        }
      );
    } catch (err) {
      console.log('Mark read error:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator
            size="large"
            color={NAVY}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
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

          <Text style={styles.headerTitle}>
            Alerts
          </Text>

          {/* Keeps title centered */}
          <View style={styles.backButton} />

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

        {/* EMPTY STATE */}
        {notifications.length === 0 && !errorMessage ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="notifications-off-outline"
              size={40}
              color="#9CA3AF"
            />

            <Text style={styles.emptyText}>
              No notifications yet.
            </Text>
          </View>
        ) : null}

        {/* NOTIFICATIONS */}
        {notifications.map((n) => (
          <TouchableOpacity
            key={n.notificationId}
            style={[
              styles.card,
              !n.isRead && styles.cardUnread,
            ]}
            onPress={() =>
              !n.isRead &&
              markAsRead(n.notificationId)
            }
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>
                {n.title}
              </Text>

              {!n.isRead ? (
                <View style={styles.unreadDot} />
              ) : null}
            </View>

            <Text style={styles.cardMessage}>
              {n.message}
            </Text>

            <Text style={styles.cardDate}>
              {n.createdAt}
            </Text>
          </TouchableOpacity>
        ))}

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

  /*
   * SAME TOP POSITION AS WORKER HOME
   */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },

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

  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
    gap: 10,
  },

  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
    flex: 1,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },

  cardMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },

  cardDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});