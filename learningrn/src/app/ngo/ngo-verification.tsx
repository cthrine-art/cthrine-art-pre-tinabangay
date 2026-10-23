import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  API_BASE_URL,
  apiGet,
  apiPost,
  Empty,
  ErrorBox,
  formatDate,
  Loading,
  NgoHeader,
  Pills,
  PrimaryButton,
  StatusBadge,
  GREEN,
  s,
} from '../../components/ngo/ngo-ui';

type Doc = { doc_type: string; file_path: string; status: string };
type PendingUser = {
  userId: number;
  fullName: string;
  mobileNo: string;
  barangay: string;
  role: string;
  docs: Doc[];
};
type HistoryItem = {
  historyId: number;
  status: string;
  remarks: string | null;
  reviewedAt: string;
  targetName: string;
  reviewerName: string;
  docType: string;
};

export default function NgoVerificationScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [tab, setTab] = useState('Pending');
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await apiGet<{ pending: PendingUser[]; history: HistoryItem[] }>(
        'ngo-get-verifications.php',
        { userId: String(userId ?? '') }
      );
      setPending(data.pending);
      setHistory(data.history);
    } catch (e: any) {
      setError(e.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const review = async (u: PendingUser, action: 'approve' | 'reject', remarks = '') => {
    setBusyId(u.userId);
    try {
      await apiPost('ngo-review-verification.php', {
        userId: Number(userId),
        targetUserId: u.userId,
        action,
        remarks,
      });
      setRejectTarget(null);
      setReason('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setBusyId(null);
    }
  };

  const doc = (u: PendingUser, type: string) => u.docs.find((d) => d.doc_type === type);

  const DocImage = ({ d, label }: { d?: Doc; label: string }) => (
    <View style={{ flex: 1 }}>
      <Text style={[s.meta, { marginBottom: 6, fontWeight: '600' }]}>{label}</Text>
      {d ? (
        <Image
          source={{ uri: `${API_BASE_URL}/${d.file_path}` }}
          style={{ width: '100%', height: 110, borderRadius: 10, backgroundColor: '#F3F4F6' }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ height: 110, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={s.meta}>Missing</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <NgoHeader title="Verification" />
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <NgoHeader title="Verification" />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Pills options={['Pending', 'History']} value={tab} onChange={setTab} />
        <ErrorBox message={error} />

        {tab === 'Pending' && pending.length === 0 && !error ? (
          <Empty icon="checkmark-done-circle-outline" text="No accounts waiting for review." />
        ) : null}

        {tab === 'Pending' &&
          pending.map((u) => {
            const busy = busyId === u.userId;
            return (
              <View key={u.userId} style={s.card}>
                <View style={s.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>{u.fullName}</Text>
                    <Text style={s.meta}>{u.mobileNo} · {u.barangay}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[s.badgeText, { color: '#6B7280' }]}>{u.role}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginVertical: 14 }}>
                  <DocImage d={doc(u, 'Valid ID')} label="Valid ID" />
                  <DocImage d={doc(u, 'Selfie')} label="Selfie" />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton label="Reject" danger loading={busy} onPress={() => setRejectTarget(u)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      style={[s.btn, { backgroundColor: GREEN }, busy && { opacity: 0.6 }]}
                      disabled={busy}
                      onPress={() => review(u, 'approve')}
                    >
                      <Text style={s.btnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

        {tab === 'History' && history.length === 0 ? (
          <Empty icon="time-outline" text="No verification decisions yet." />
        ) : null}

        {tab === 'History' &&
          history.map((h) => (
            <View key={h.historyId} style={s.card}>
              <View style={s.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{h.targetName}</Text>
                  <Text style={s.meta}>{h.docType} · reviewed by {h.reviewerName}</Text>
                </View>
                <StatusBadge status={h.status} />
              </View>
              {h.remarks ? <Text style={s.body}>“{h.remarks}”</Text> : null}
              <Text style={[s.meta, { marginTop: 8 }]}>{formatDate(h.reviewedAt)}</Text>
            </View>
          ))}
      </ScrollView>

      <Modal visible={!!rejectTarget} transparent animationType="slide" onRequestClose={() => setRejectTarget(null)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Reject {rejectTarget?.fullName}?</Text>
            <Text style={s.label}>REASON (SHOWN TO THE USER)</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder="e.g. The ID photo is blurry. Please retake it."
              placeholderTextColor="#9CA3AF"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity style={[s.btn, { backgroundColor: '#F3F4F6' }]} onPress={() => setRejectTarget(null)}>
                  <Text style={[s.btnText, { color: '#6B7280' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Reject"
                  danger
                  loading={busyId === rejectTarget?.userId}
                  onPress={() => {
                    if (!reason.trim()) {
                      Alert.alert('Reason needed', 'Please tell the user what to fix.');
                      return;
                    }
                    if (rejectTarget) review(rejectTarget, 'reject', reason.trim());
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
