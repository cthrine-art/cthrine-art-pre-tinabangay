import React, { useCallback, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  apiGet,
  Empty,
  ErrorBox,
  formatDate,
  Loading,
  NgoHeader,
  Pills,
  StatusBadge,
  GREEN,
  NAVY,
  s,
} from '../../components/ngo/ngo-ui';

type ProgramProgress = {
  programId: number;
  programName: string;
  status: string;
  startDate: string;
  endDate: string | null;
  total: number;
  active: number;
  inactive: number;
  completed: number;
};
type LogItem = { action: string; timestamp: string; staffName: string };

export default function NgoActivityScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [tab, setTab] = useState('Progress');
  const [programs, setPrograms] = useState<ProgramProgress[]>([]);
  const [log, setLog] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const d = await apiGet<{ programs: ProgramProgress[]; log: LogItem[] }>('ngo-get-activity.php', {
        userId: String(userId ?? ''),
      });
      setPrograms(d.programs);
      setLog(d.log);
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

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <NgoHeader title="Activity Monitoring" />
        <Loading />
      </SafeAreaView>
    );
  }

  const totals = programs.reduce(
    (a, p) => ({
      total: a.total + p.total,
      active: a.active + p.active,
      completed: a.completed + p.completed,
    }),
    { total: 0, active: 0, completed: 0 }
  );
  const completionRate = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;

  return (
    <SafeAreaView style={s.container}>
      <NgoHeader title="Activity Monitoring" />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Pills options={['Progress', 'Recent activity']} value={tab} onChange={setTab} />
        <ErrorBox message={error} />

        {tab === 'Progress' && (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Enrolled', value: totals.total },
                { label: 'Active', value: totals.active },
                { label: 'Completion', value: `${completionRate}%` },
              ].map((x) => (
                <View key={x.label} style={[s.card, { flex: 1, alignItems: 'center', marginBottom: 0, paddingVertical: 14 }]}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: NAVY }}>{x.value}</Text>
                  <Text style={s.meta}>{x.label}</Text>
                </View>
              ))}
            </View>

            {programs.length === 0 && !error ? (
              <Empty icon="pulse-outline" text="No programs to monitor yet." />
            ) : null}

            {programs.map((p) => {
              const pct = p.total ? Math.round((p.completed / p.total) * 100) : 0;
              return (
                <View key={p.programId} style={s.card}>
                  <View style={s.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.title}>{p.programName}</Text>
                      <Text style={s.meta}>
                        {formatDate(p.startDate)} → {p.endDate ? formatDate(p.endDate) : 'Ongoing'}
                      </Text>
                    </View>
                    <StatusBadge status={p.status} />
                  </View>

                  <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', marginTop: 14, overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: GREEN }} />
                  </View>
                  <Text style={[s.meta, { marginTop: 6 }]}>{pct}% completed · {p.total} enrolled</Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <StatusBadge status="Active" />
                    <Text style={[s.meta, { alignSelf: 'center', marginRight: 6 }]}>{p.active}</Text>
                    <StatusBadge status="Completed" />
                    <Text style={[s.meta, { alignSelf: 'center', marginRight: 6 }]}>{p.completed}</Text>
                    <StatusBadge status="Inactive" />
                    <Text style={[s.meta, { alignSelf: 'center' }]}>{p.inactive}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {tab === 'Recent activity' && (
          <>
            {log.length === 0 && !error ? (
              <Empty icon="time-outline" text="No activity yet. Actions you take will show up here." />
            ) : null}
            {log.map((l, i) => (
              <View key={i} style={[s.card, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.title, { fontSize: 13 }]}>{l.action}</Text>
                  <Text style={s.meta}>{l.staffName} · {formatDate(l.timestamp)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
