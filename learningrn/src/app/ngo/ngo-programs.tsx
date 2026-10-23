import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
  Loading,
  NgoHeader,
  Pills,
  PrimaryButton,
  s,
  StatusBadge,
  today,
} from '../../components/ngo/ngo-ui';

type Program = {
  programId: number;
  programName: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  beneficiaryCount: number;
};

const STATUSES = ['Active', 'Completed', 'Cancelled'];

export default function NgoProgramsScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState('Active');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const d = await apiGet<{ programs: Program[] }>('ngo-get-programs.php', { userId: String(userId ?? '') });
      setPrograms(d.programs);
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

  const openForm = (p?: Program) => {
    setEditing(p ?? null);
    setName(p?.programName ?? '');
    setDesc(p?.description ?? '');
    setStart(p?.startDate ?? today());
    setEnd(p?.endDate ?? '');
    setStatus(p?.status ?? 'Active');
    setFormOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter a program name.');
      return;
    }
    setSaving(true);
    try {
      await apiPost('ngo-save-program.php', {
        userId: Number(userId),
        action: editing ? 'update' : 'create',
        programId: editing?.programId,
        programName: name.trim(),
        description: desc,
        startDate: start.trim(),
        endDate: end.trim(),
        status,
      });
      setFormOpen(false);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = (p: Program) => {
    Alert.alert(
      'Delete program?',
      p.beneficiaryCount > 0
        ? `This also removes its ${p.beneficiaryCount} enrolled beneficiar${p.beneficiaryCount === 1 ? 'y' : 'ies'} from the program. Consider marking it Completed or Cancelled instead.`
        : `"${p.programName}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiPost('ngo-save-program.php', { userId: Number(userId), action: 'delete', programId: p.programId });
              setFormOpen(false);
              await load();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const shown = filter === 'All' ? programs : programs.filter((p) => p.status === filter);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <NgoHeader title="Livelihood Programs" />
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <NgoHeader title="Livelihood Programs" />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Pills options={['All', ...STATUSES]} value={filter} onChange={setFilter} />
        <ErrorBox message={error} />

        {shown.length === 0 && !error ? (
          <Empty icon="ribbon-outline" text={programs.length ? 'No programs with this status.' : 'No programs yet. Tap + to create your first one.'} />
        ) : null}

        {shown.map((p) => (
          <TouchableOpacity key={p.programId} style={s.card} activeOpacity={0.85} onPress={() => openForm(p)}>
            <View style={s.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{p.programName}</Text>
                <Text style={s.meta}>
                  {formatDate(p.startDate)} → {p.endDate ? formatDate(p.endDate) : 'Ongoing'}
                </Text>
              </View>
              <StatusBadge status={p.status} />
            </View>
            {p.description ? <Text style={s.body} numberOfLines={3}>{p.description}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Ionicons name="people-outline" size={14} color="#9CA3AF" />
              <Text style={s.meta}>{p.beneficiaryCount} beneficiar{p.beneficiaryCount === 1 ? 'y' : 'ies'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => openForm()}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>{editing ? 'Edit program' : 'New program'}</Text>

              <Text style={s.label}>PROGRAM NAME *</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Basic Carpentry Training" placeholderTextColor="#9CA3AF" />

              <Text style={s.label}>DESCRIPTION</Text>
              <TextInput style={[s.input, s.inputMulti]} value={desc} onChangeText={setDesc} multiline placeholder="What will beneficiaries learn or receive?" placeholderTextColor="#9CA3AF" />

              <Text style={s.label}>START DATE (YYYY-MM-DD) *</Text>
              <TextInput style={s.input} value={start} onChangeText={setStart} placeholder="2026-10-01" placeholderTextColor="#9CA3AF" autoCapitalize="none" />

              <Text style={s.label}>END DATE (OPTIONAL)</Text>
              <TextInput style={s.input} value={end} onChangeText={setEnd} placeholder="2026-12-31" placeholderTextColor="#9CA3AF" autoCapitalize="none" />

              <Text style={s.label}>STATUS</Text>
              <Pills options={STATUSES} value={status} onChange={setStatus} />

              <PrimaryButton label={editing ? 'Save changes' : 'Create program'} onPress={save} loading={saving} />
              <View style={{ height: 10 }} />
              {editing ? <PrimaryButton label="Delete program" danger onPress={() => remove(editing)} /> : null}
              <TouchableOpacity style={{ alignItems: 'center', marginTop: 14, marginBottom: 6 }} onPress={() => setFormOpen(false)}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
