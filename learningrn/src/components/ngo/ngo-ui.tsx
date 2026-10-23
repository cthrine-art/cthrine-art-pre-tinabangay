import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

export const NAVY = '#0F1F3D';
export const GREEN = '#2E7D32';
export const BG = '#FAF7F2';

export async function apiGet<T = any>(file: string, params: Record<string, string | number> = {}) {
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  const res = await fetch(`${API_BASE_URL}/${file}${qs ? `?${qs}` : ''}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data as T;
}

export async function apiPost<T = any>(file: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/${file}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data as T;
}

/** Back-arrow header used by every NGO sub-screen. */
export function NgoHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/ngo/ngo-home'));
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={goBack} style={s.headerBtn}>
        <Ionicons name="chevron-back" size={22} color={NAVY} />
      </TouchableOpacity>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={s.headerBtn}>{right}</View>
    </View>
  );
}

export function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={NAVY} />
    </View>
  );
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={s.errorBox}>
      <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}

export function Empty({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={40} color="#9CA3AF" />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  Active: { bg: '#E8F5E9', fg: GREEN },
  Approved: { bg: '#E8F5E9', fg: GREEN },
  Completed: { bg: '#E0F2FE', fg: '#0369A1' },
  Inactive: { bg: '#F3F4F6', fg: '#6B7280' },
  Pending: { bg: '#FEF3C7', fg: '#B45309' },
  Cancelled: { bg: '#FEF2F2', fg: '#DC2626' },
  Rejected: { bg: '#FEF2F2', fg: '#DC2626' },
};

export function StatusBadge({ status }: { status: string }) {
  const c = BADGE_COLORS[status] ?? BADGE_COLORS.Inactive;
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.badgeText, { color: c.fg }]}>{status}</Text>
    </View>
  );
}

/** Row of selectable pills, used for status pickers and filters. */
export function Pills({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.pillRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[s.pill, value === o && s.pillOn]}
          onPress={() => onChange(o)}
        >
          <Text style={[s.pillText, value === o && s.pillTextOn]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  danger,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.btn, danger && s.btnDanger, loading && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={danger ? '#DC2626' : '#FFFFFF'} size="small" />
      ) : (
        <Text style={[s.btnText, danger && s.btnDangerText]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export const formatDate = (d?: string | null) => {
  if (!d) return '—';
  const dt = new Date(d.replace(' ', 'T'));
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const today = () => new Date().toISOString().slice(0, 10);

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 40 : 14,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: NAVY },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
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
  empty: { alignItems: 'center', marginTop: 70, gap: 10 },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: NAVY },
  meta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  body: { fontSize: 13, color: '#4B5563', marginTop: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillOn: { backgroundColor: NAVY, borderColor: NAVY },
  pillText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  pillTextOn: { color: '#FFFFFF' },
  btn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  btnDanger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  btnDangerText: { color: '#DC2626' },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: NAVY,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,31,61,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: NAVY, marginBottom: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
