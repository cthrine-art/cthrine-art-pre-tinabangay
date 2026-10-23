import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
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

type UserAccount = {
  userId: number;
  fullName: string;
  mobileNo: string;
  email: string;
  barangay: string;
  isVerified: boolean;
  status: string; // 'Active' | 'Suspended'
  role: string; // 'Worker' | 'Employer' | 'Admin'
};

type RoleFilter = 'All' | 'Worker' | 'Employer';

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

export default function AdminAccountsScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [actingOnUserId, setActingOnUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/get-all-users.php`);
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to load accounts.');
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      setErrorMessage('Could not reach the server for accounts.');
      console.log('Users fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleStatusChange = async (userId: number, action: 'activate' | 'suspend' | 'delete') => {
    setActingOnUserId(userId);
    try {
      const response = await fetch(`${API_BASE_URL}/update-user-status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Something went wrong.');
        return;
      }

      if (action === 'delete') {
        setUsers((prev) => prev.filter((u) => u.userId !== userId));
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.userId === userId ? { ...u, status: data.status } : u))
        );
      }
    } catch (err) {
      Alert.alert('Connection error', 'Could not reach the server.');
      console.log('Status update error:', err);
    } finally {
      setActingOnUserId(null);
    }
  };

  const confirmDelete = (userId: number, fullName: string) => {
    Alert.alert(
      'Delete account?',
      `This permanently removes ${fullName}'s account. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleStatusChange(userId, 'delete') },
      ]
    );
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q || u.fullName.toLowerCase().includes(q) || u.mobileNo.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounts</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or mobile number"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(['All', 'Worker', 'Employer'] as RoleFilter[]).map((r) => {
          const selected = roleFilter === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setRoleFilter(r)}
            >
              <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                {r}
              </Text>
            </TouchableOpacity>
          );
        })}
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

        {filteredUsers.length === 0 && !errorMessage ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>No accounts match.</Text>
          </View>
        ) : null}

        {filteredUsers.map((user) => {
          const busy = actingOnUserId === user.userId;
          const suspended = user.status === 'Suspended';

          return (
            <View key={user.userId} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    {user.isVerified ? (
                      <Ionicons name="checkmark-circle" size={15} color={GREEN} />
                    ) : (
                      <Ionicons name="time-outline" size={15} color="#B45309" />
                    )}
                  </View>
                  <Text style={styles.userMeta}>
                    {user.mobileNo}
                    {user.barangay ? ` · ${user.barangay}` : ''}
                  </Text>
                </View>

                <View style={styles.badgeCol}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{user.role}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      suspended ? styles.statusSuspended : styles.statusActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        suspended ? styles.statusTextSuspended : styles.statusTextActive,
                      ]}
                    >
                      {user.status}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => confirmDelete(user.userId, user.fullName)}
                  disabled={busy}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    suspended ? styles.activateButton : styles.suspendButton,
                  ]}
                  onPress={() => handleStatusChange(user.userId, suspended ? 'activate' : 'suspend')}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator color={suspended ? '#FFFFFF' : NAVY} size="small" />
                  ) : (
                    <Text style={suspended ? styles.activateText : styles.suspendText}>
                      {suspended ? 'Reactivate' : 'Suspend'}
                    </Text>
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: NAVY, padding: 0 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  filterChipSelected: { backgroundColor: NAVY },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextSelected: { color: '#FFFFFF' },
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
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 14, fontWeight: '700', color: NAVY },
  userMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  badgeCol: { alignItems: 'flex-end', gap: 6 },
  roleBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusActive: { backgroundColor: '#EAF6EC' },
  statusSuspended: { backgroundColor: '#FEF2F2' },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusTextActive: { color: GREEN },
  statusTextSuspended: { color: '#DC2626' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  deleteText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  suspendButton: { backgroundColor: '#F3F4F6' },
  suspendText: { color: NAVY, fontWeight: '700', fontSize: 13 },
  activateButton: { backgroundColor: GREEN },
  activateText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});