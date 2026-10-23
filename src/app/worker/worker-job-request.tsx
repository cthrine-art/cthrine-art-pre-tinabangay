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
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

type JobRequest = {
  requestId: number;
  status: string;
  createdAt: string;
  jobTitle: string;
  barangay: string;
  price: string;
};

function statusStyle(status: string) {
  const s = status.toLowerCase();
  if (s === 'accepted') return { bg: '#EAF6EC', text: GREEN };
  if (s === 'declined' || s === 'rejected') return { bg: '#FEF2F2', text: '#DC2626' };
  return { bg: '#FEF9E7', text: '#B45309' }; // pending / default
}

export default function WorkerJobRequestScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If there's no screen behind this one (reloaded directly here, or
  // opened fresh), fall back to Worker Home instead of crashing into
  // Expo Router's "Unmatched Route" screen.
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/worker/worker-home', params: { userId } });
    }
  };

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      setErrorMessage('No user ID was passed to this screen — please log in again.');
      setLoading(false);
      return;
    }
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/get-job-requests.php?userId=${userId}`);
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to load requests.');
        return;
      }
      setRequests(data.requests || []);
    } catch (err) {
      setErrorMessage('Could not reach the server.');
      console.log('Requests fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {requests.length === 0 && !errorMessage ? (
          <View style={styles.emptyBox}>
            <Ionicons name="paper-plane-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>No requests yet.</Text>
          </View>
        ) : null}

        {requests.map((r) => {
          const badge = statusStyle(r.status);
          return (
            <View key={r.requestId} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.jobTitle}>{r.jobTitle}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusText, { color: badge.text }]}>{r.status}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {r.barangay} · {r.price}
              </Text>
              <Text style={styles.date}>{r.createdAt}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: NAVY },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
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
  errorText: { fontSize: 12, color: '#DC2626', flex: 1 },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: 13, color: '#9CA3AF' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  jobTitle: { fontSize: 14, fontWeight: '700', color: NAVY, flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  meta: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  date: { fontSize: 11, color: '#9CA3AF' },
});