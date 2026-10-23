import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  apiGet,
  apiPost,
  ErrorBox,
  Loading,
  PrimaryButton,
  GREEN,
  NAVY,
  s,
} from '../../components/ngo/ngo-ui';

type Profile = {
  ngoId: number;
  organizationName: string;
  address: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
};

type Stats = {
  pendingVerifications: number;
  activePrograms: number;
  totalPrograms: number;
  activeBeneficiaries: number;
  completedBeneficiaries: number;
};

export default function NgoHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; fullName?: string }>();
  const userId = params.userId ? String(params.userId) : '';
  const fullName = params.fullName ? String(params.fullName) : 'NGO Staff';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);

  // profile form
  const [org, setOrg] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setError('Missing user. Please log in again.');
      setLoading(false);
      return;
    }
    setError('');
    try {
      const { profile: p } = await apiGet<{ profile: Profile | null }>('ngo-get-profile.php', { userId });
      setProfile(p);
      if (p) {
        setOrg(p.organizationName);
        setAddress(p.address ?? '');
        setContact(p.contactPerson ?? '');
        setEmail(p.email ?? '');
        setPhone(p.phone ?? '');
        setPosition(p.position ?? '');
        setStats(await apiGet<Stats>('ngo-dashboard.php', { userId }));
      }
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

  const saveProfile = async () => {
    if (!org.trim()) {
      Alert.alert('Missing info', 'Please enter your organization name.');
      return;
    }
    setSaving(true);
    try {
      await apiPost('ngo-save-profile.php', {
        userId: Number(userId),
        organizationName: org.trim(),
        address,
        contactPerson: contact,
        email,
        phone,
        position,
      });
      setEditing(false);
      setLoading(true);
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const open = (route: string) =>
    router.push({ pathname: route as any, params: { userId, fullName } });

  const logout = () => router.replace('/(auth)/login' as any);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <Loading />
      </SafeAreaView>
    );
  }

  /* ---------- First-time NGO profile setup / edit ---------- */
  if (!profile || editing) {
    return (
      <SafeAreaView style={s.container}>
        <ScrollView contentContainerStyle={[s.scroll, { paddingTop: 60 }]} keyboardShouldPersistTaps="handled">
          <Text style={[s.modalTitle, { fontSize: 22 }]}>
            {profile ? 'Edit NGO profile' : 'Complete your NGO profile'}
          </Text>
          <Text style={[s.body, { marginTop: 0, marginBottom: 20 }]}>
            Tell us about the organization you work for. You can change this later.
          </Text>
          <ErrorBox message={error} />

          <Text style={s.label}>ORGANIZATION NAME *</Text>
          <TextInput style={s.input} value={org} onChangeText={setOrg} placeholder="e.g. Tinabangay Foundation" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>YOUR POSITION</Text>
          <TextInput style={s.input} value={position} onChangeText={setPosition} placeholder="e.g. Program Coordinator" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>ADDRESS</Text>
          <TextInput style={s.input} value={address} onChangeText={setAddress} placeholder="Office address" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>CONTACT PERSON</Text>
          <TextInput style={s.input} value={contact} onChangeText={setContact} placeholder="Full name" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>ORGANIZATION EMAIL</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="info@ngo.org" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="email-address" />
          <Text style={s.label}>PHONE</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="09xxxxxxxxx" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={15} />

          <PrimaryButton label="Save profile" onPress={saveProfile} loading={saving} />
          {profile ? (
            <TouchableOpacity style={{ alignItems: 'center', marginTop: 14 }} onPress={() => setEditing(false)}>
              <Text style={{ color: '#6B7280', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={{ alignItems: 'center', marginTop: 14 }} onPress={logout}>
              <Text style={{ color: '#6B7280', fontWeight: '600' }}>Log out</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ---------- Dashboard ---------- */
  const modules: {
    label: string;
    hint: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: string;
    badge?: number;
  }[] = [
    {
      label: 'Verification',
      hint: 'Review worker & employer IDs',
      icon: 'shield-checkmark-outline',
      route: '/ngo/ngo-verification',
      badge: stats?.pendingVerifications,
    },
    {
      label: 'Beneficiary Management',
      hint: 'Enroll and track beneficiaries',
      icon: 'people-outline',
      route: '/ngo/ngo-beneficiaries',
    },
    {
      label: 'Livelihood Programs',
      hint: 'Create and manage programs',
      icon: 'ribbon-outline',
      route: '/ngo/ngo-programs',
    },
    {
      label: 'Activity Monitoring',
      hint: 'Progress and recent activity',
      icon: 'pulse-outline',
      route: '/ngo/ngo-activity',
    },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={[st.scrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View style={st.topRow}>
          <View style={st.topLeft}>
            <Image source={require('../../../assets/tinabangay-logo.png')} style={st.avatar} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={st.userName} numberOfLines={1}>{fullName}</Text>
              <Text style={st.userRole}>NGO STAFF</Text>
            </View>
          </View>
          <TouchableOpacity style={st.iconBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        <ErrorBox message={error} />

        <TouchableOpacity style={st.orgCard} activeOpacity={0.9} onPress={() => setEditing(true)}>
          <View style={{ flex: 1 }}>
            <Text style={st.orgName}>{profile.organizationName}</Text>
            <Text style={st.orgMeta}>
              {[profile.position, profile.address].filter(Boolean).join(' · ') || 'Tap to add details'}
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={st.statsRow}>
          <Stat label="Active programs" value={stats?.activePrograms ?? 0} />
          <Stat label="Active beneficiaries" value={stats?.activeBeneficiaries ?? 0} />
          <Stat label="Completed" value={stats?.completedBeneficiaries ?? 0} />
        </View>

        <Text style={st.sectionTitle}>NGO Management</Text>
        {modules.map((m) => (
          <TouchableOpacity key={m.route} style={st.moduleCard} activeOpacity={0.85} onPress={() => open(m.route)}>
            <View style={st.moduleIcon}>
              <Ionicons name={m.icon} size={22} color={GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.moduleLabel}>{m.label}</Text>
              <Text style={st.moduleHint}>{m.hint}</Text>
            </View>
            {m.badge ? (
              <View style={st.countBadge}>
                <Text style={st.countBadgeText}>{m.badge}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={st.stat}>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 80, paddingBottom: 35 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF' },
  userName: { fontSize: 15, fontWeight: '700', color: NAVY },
  userRole: { fontSize: 11, fontWeight: '700', color: GREEN, letterSpacing: 0.5, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  orgCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, borderRadius: 18, padding: 18, marginBottom: 16, gap: 10 },
  orgName: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  orgMeta: { color: '#CBD5E1', fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  stat: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: NAVY },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 12 },
  moduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, gap: 12 },
  moduleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { fontSize: 14, fontWeight: '700', color: NAVY },
  moduleHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  countBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
