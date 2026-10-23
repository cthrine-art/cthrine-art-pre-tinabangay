import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  apiGet,
  apiPost,
  Empty,
  ErrorBox,
  formatDate,
  GREEN,
  Loading,
  NAVY,
  NgoHeader,
  Pills,
  PrimaryButton,
  s,
  StatusBadge,
  today,
} from '../../components/ngo/ngo-ui';

type Beneficiary = {
  beneficiaryId: number;
  userId: number;
  programId: number;
  programName: string;
  fullName: string;
  mobileNo: string;
  barangay: string;
  enrollmentDate: string;
  status: string;
  notes: string | null;
  jobsCompleted: number;
};
type Program = { programId: number; programName: string; status: string };
type Worker = { userId: number; fullName: string; mobileNo: string; barangay: string };

const STATUSES = ['Active', 'Inactive', 'Completed'];

export default function NgoBeneficiariesScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [list, setList] = useState<Beneficiary[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // edit modal
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [editStatus, setEditStatus] = useState('Active');
  const [editNotes, setEditNotes] = useState('');

  // add modal
  const [addOpen, setAddOpen] = useState(false);
  const [workerQuery, setWorkerQuery] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [picked, setPicked] = useState<Worker | null>(null);
  const [programId, setProgramId] = useState<number | null>(null);
  const [enrollDate, setEnrollDate] = useState(today());
  const [addNotes, setAddNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const uid = String(userId ?? '');
      const [b, p] = await Promise.all([
        apiGet<{ beneficiaries: Beneficiary[] }>('ngo-get-beneficiaries.php', { userId: uid }),
        apiGet<{ programs: Program[] }>('ngo-get-programs.php', { userId: uid }),
      ]);
      setList(b.beneficiaries);
      setPrograms(p.programs);
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

  // Search verified-or-not active workers as the staff types.
  useEffect(() => {
    if (!addOpen || picked) return;
    const t = setTimeout(async () => {
      try {
        const d = await apiGet<{ workers: Worker[] }>('ngo-search-workers.php', {
          userId: String(userId ?? ''),
          q: workerQuery,
        });
        setWorkers(d.workers);
      } catch {
        setWorkers([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [workerQuery, addOpen, picked, userId]);

  const openAdd = () => {
    if (programs.length === 0) {
      Alert.alert('Create a program first', 'Beneficiaries are enrolled into a livelihood program. Add one in Livelihood Programs.');
      return;
    }
    setPicked(null);
    setWorkerQuery('');
    setWorkers([]);
    setProgramId(programs.find((p) => p.status === 'Active')?.programId ?? programs[0].programId);
    setEnrollDate(today());
    setAddNotes('');
    setAddOpen(true);
  };

  const add = async () => {
    if (!picked || !programId) {
      Alert.alert('Missing info', 'Choose a worker and a program.');
      return;
    }
    setSaving(true);
    try {
      await apiPost('ngo-save-beneficiary.php', {
        userId: Number(userId),
        action: 'add',
        beneficiaryUserId: picked.userId,
        programId,
        enrollmentDate: enrollDate.trim(),
        status: 'Active',
        notes: addNotes,
      });
      setAddOpen(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not enroll', e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiPost('ngo-save-beneficiary.php', {
        userId: Number(userId),
        action: 'update',
        beneficiaryId: editing.beneficiaryId,
        status: editStatus,
        notes: editNotes,
      });
      setEditing(null);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = (b: Beneficiary) => {
    Alert.alert('Remove beneficiary?', `${b.fullName} will be removed from "${b.programName}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiPost('ngo-save-beneficiary.php', { userId: Number(userId), action: 'remove', beneficiaryId: b.beneficiaryId });
            setEditing(null);
            await load();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const shown = list.filter(
    (b) =>
      (filter === 'All' || b.status === filter) &&
      (!query.trim() ||
        b.fullName.toLowerCase().includes(query.trim().toLowerCase()) ||
        b.programName.toLowerCase().includes(query.trim().toLowerCase()))
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <NgoHeader title="Beneficiaries" />
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <NgoHeader title="Beneficiaries" />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 110 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <TextInput
          style={s.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or program"
          placeholderTextColor="#9CA3AF"
        />
        <Pills options={['All', ...STATUSES]} value={filter} onChange={setFilter} />
        <ErrorBox message={error} />

        {shown.length === 0 && !error ? (
          <Empty icon="people-outline" text={list.length ? 'No beneficiaries match.' : 'No beneficiaries yet. Tap + to enroll a worker.'} />
        ) : null}

        {shown.map((b) => (
          <TouchableOpacity
            key={b.beneficiaryId}
            style={s.card}
            activeOpacity={0.85}
            onPress={() => {
              setEditing(b);
              setEditStatus(b.status);
              setEditNotes(b.notes ?? '');
            }}
          >
            <View style={s.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{b.fullName}</Text>
                <Text style={s.meta}>{b.mobileNo} · {b.barangay}</Text>
              </View>
              <StatusBadge status={b.status} />
            </View>
            <Text style={[s.body, { color: NAVY, fontWeight: '600' }]}>{b.programName}</Text>
            <Text style={[s.meta, { marginTop: 4 }]}>
              Enrolled {formatDate(b.enrollmentDate)} · {b.jobsCompleted} job{b.jobsCompleted === 1 ? '' : 's'} completed
            </Text>
            {b.notes ? <Text style={[s.body, { fontStyle: 'italic' }]} numberOfLines={2}>{b.notes}</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={openAdd}>
        <Ionicons name="person-add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ADD */}
      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>Enroll a beneficiary</Text>

              <Text style={s.label}>WORKER *</Text>
              {picked ? (
                <TouchableOpacity style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]} onPress={() => setPicked(null)}>
                  <Ionicons name="person-circle-outline" size={28} color={GREEN} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>{picked.fullName}</Text>
                    <Text style={s.meta}>{picked.mobileNo} · {picked.barangay}</Text>
                  </View>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Change</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput style={s.input} value={workerQuery} onChangeText={setWorkerQuery} placeholder="Search worker by name, mobile or barangay" placeholderTextColor="#9CA3AF" />
                  {workers.map((w) => (
                    <TouchableOpacity key={w.userId} style={[s.card, { padding: 12, marginBottom: 8 }]} onPress={() => setPicked(w)}>
                      <Text style={s.title}>{w.fullName}</Text>
                      <Text style={s.meta}>{w.mobileNo} · {w.barangay}</Text>
                    </TouchableOpacity>
                  ))}
                  {workers.length === 0 ? <Text style={[s.meta, { marginBottom: 14 }]}>No workers found.</Text> : null}
                </>
              )}

              <Text style={s.label}>PROGRAM *</Text>
              <View style={s.pillRow}>
                {programs.map((p) => (
                  <TouchableOpacity key={p.programId} style={[s.pill, programId === p.programId && s.pillOn]} onPress={() => setProgramId(p.programId)}>
                    <Text style={[s.pillText, programId === p.programId && s.pillTextOn]}>{p.programName}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>ENROLLMENT DATE (YYYY-MM-DD)</Text>
              <TextInput style={s.input} value={enrollDate} onChangeText={setEnrollDate} autoCapitalize="none" placeholderTextColor="#9CA3AF" />

              <Text style={s.label}>NOTES</Text>
              <TextInput style={[s.input, s.inputMulti]} value={addNotes} onChangeText={setAddNotes} multiline placeholder="Optional" placeholderTextColor="#9CA3AF" />

              <PrimaryButton label="Enroll" onPress={add} loading={saving} />
              <TouchableOpacity style={{ alignItems: 'center', marginTop: 14, marginBottom: 6 }} onPress={() => setAddOpen(false)}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT */}
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>{editing?.fullName}</Text>
              <Text style={[s.meta, { marginTop: -10, marginBottom: 16 }]}>{editing?.programName}</Text>

              <Text style={s.label}>STATUS</Text>
              <Pills options={STATUSES} value={editStatus} onChange={setEditStatus} />

              <Text style={s.label}>NOTES</Text>
              <TextInput style={[s.input, s.inputMulti]} value={editNotes} onChangeText={setEditNotes} multiline placeholder="Progress notes" placeholderTextColor="#9CA3AF" />

              <PrimaryButton label="Save changes" onPress={saveEdit} loading={saving} />
              <View style={{ height: 10 }} />
              {editing ? <PrimaryButton label="Remove from program" danger onPress={() => remove(editing)} /> : null}
              <TouchableOpacity style={{ alignItems: 'center', marginTop: 14, marginBottom: 6 }} onPress={() => setEditing(null)}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
