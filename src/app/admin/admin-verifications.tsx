import React, { useCallback, useEffect, useState } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

type PendingDoc = { doc_type: string; file_path: string; status: string };
type PendingUser = {
  userId: number;
  fullName: string;
  mobileNo: string;
  barangay: string;
  role: string;
  docs: PendingDoc[];
};

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

export default function AdminVerificationsScreen() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actingOnUserId, setActingOnUserId] = useState<number | null>(null);

  const fetchPending = useCallback(async () => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/get-pending-verifications.php`);
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to load pending accounts.');
        return;
      }

      setPending(data.pending || []);
    } catch (err) {
      setErrorMessage('Could not reach the server for pending accounts.');
      console.log('Pending fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPending();
  };

  // If there's no screen behind this one (e.g. reloaded directly here,
  // or opened fresh), fall back to the dashboard instead of showing
  // Expo Router's "Unmatched Route" screen.
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/admin/admin-dashboard');
    }
  };

  const handleReview = async (userId: number, action: 'approve' | 'reject') => {
    setActingOnUserId(userId);
    try {
      const response = await fetch(`${API_BASE_URL}/review-verification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Something went wrong.');
        return;
      }

      setPending((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      Alert.alert('Connection error', 'Could not reach the server.');
      console.log('Review error:', err);
    } finally {
      setActingOnUserId(null);
    }
  };

  const confirmReject = (userId: number, fullName: string) => {
    Alert.alert(
      'Reject account?',
      `${fullName}'s documents will be marked as rejected. They'll need to resubmit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => handleReview(userId, 'reject') },
      ]
    );
  };

  const findDoc = (docs: PendingDoc[], type: string) => docs.find((d) => d.doc_type === type);

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
        <Text style={styles.headerTitle}>Verifications</Text>
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

        {pending.length === 0 && !errorMessage ? (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-done-circle-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>No accounts waiting for review.</Text>
          </View>
        ) : null}

        {pending.map((user) => {
          const idDoc = findDoc(user.docs, 'Valid ID');
          const selfieDoc = findDoc(user.docs, 'Selfie');
          const busy = actingOnUserId === user.userId;

          return (
            <View key={user.userId} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{user.fullName}</Text>
                  <Text style={styles.userMeta}>
                    {user.mobileNo} · {user.barangay}
                  </Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{user.role}</Text>
                </View>
              </View>

              <View style={styles.imagesRow}>
                <View style={styles.imageWrap}>
                  <Text style={styles.imageLabel}>Valid ID</Text>
                  {idDoc ? (
                    <Image
                      source={{ uri: `${API_BASE_URL}/${idDoc.file_path}` }}
                      style={styles.docImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.docImage, styles.docImageMissing]}>
                      <Text style={styles.missingText}>Missing</Text>
                    </View>
                  )}
                </View>

                <View style={styles.imageWrap}>
                  <Text style={styles.imageLabel}>Selfie</Text>
                  {selfieDoc ? (
                    <Image
                      source={{ uri: `${API_BASE_URL}/${selfieDoc.file_path}` }}
                      style={styles.docImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.docImage, styles.docImageMissing]}>
                      <Text style={styles.missingText}>Missing</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => confirmReject(user.userId, user.fullName)}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator color="#DC2626" size="small" />
                  ) : (
                    <Text style={styles.rejectText}>Reject</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleReview(user.userId, 'approve')}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.approveText}>Approve</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  userName: { fontSize: 15, fontWeight: '700', color: NAVY },
  userMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  roleBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  imagesRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  imageWrap: { flex: 1 },
  imageLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 6 },
  docImage: { width: '100%', height: 110, borderRadius: 10, backgroundColor: '#F3F4F6' },
  docImageMissing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 11, color: '#9CA3AF' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  rejectText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  approveButton: { backgroundColor: GREEN },
  approveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});