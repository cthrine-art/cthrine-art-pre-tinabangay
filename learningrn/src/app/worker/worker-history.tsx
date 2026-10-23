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

type HistoryEntry = {
  completionId: number;
  completedAt: string;
  rating: number | null;
  feedback: string | null;
  jobTitle: string;
  barangay: string;
  price: string;
};

export default function HistoryScreen() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId?: string;
  }>();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchHistory = useCallback(async () => {
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
        `${API_BASE_URL}/get-job-history.php?userId=${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.error || 'Failed to load history.'
        );
        return;
      }

      setHistory(data.history || []);
    } catch (err) {
      setErrorMessage('Could not reach the server.');
      console.log('History fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
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
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/worker/worker-home');
              }
            }}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={NAVY}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Job History
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
        {history.length === 0 && !errorMessage ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="reader-outline"
              size={40}
              color="#9CA3AF"
            />

            <Text style={styles.emptyText}>
              No completed jobs yet.
            </Text>
          </View>
        ) : null}

        {/* HISTORY */}
        {history.map((h) => (
          <View
            key={h.completionId}
            style={styles.card}
          >

            <View style={styles.cardTop}>

              <Text style={styles.jobTitle}>
                {h.jobTitle}
              </Text>

              {h.rating !== null ? (
                <View style={styles.ratingRow}>

                  <Ionicons
                    name="star"
                    size={13}
                    color="#B45309"
                  />

                  <Text style={styles.ratingText}>
                    {h.rating.toFixed(1)}
                  </Text>

                </View>
              ) : null}

            </View>

            <Text style={styles.meta}>
              {h.barangay} · {h.price}
            </Text>

            {h.feedback ? (
              <Text style={styles.feedback}>
                "{h.feedback}"
              </Text>
            ) : null}

            <Text style={styles.date}>
              Completed {h.completedAt}
            </Text>

          </View>
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


  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 70,
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

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  jobTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
    flex: 1,
    marginRight: 8,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },

  meta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },

  feedback: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 6,
  },

  date: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});