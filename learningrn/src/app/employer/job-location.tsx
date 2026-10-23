import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

export default function JobLocationScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    userId?: string;
    fullName?: string;
    title?: string;
    categoryId?: string;
    categoryName?: string;
    requiredSkills?: string;
    schedule?: string;
    budget?: string;
    description?: string;
    jobType?: string;
  }>();

  const userId = params.userId ? String(params.userId) : '';
  const fullName = params.fullName ? String(params.fullName) : 'Employer';

  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [posted, setPosted] = useState(false);

  const handleBack = () => {
    if (submitting) return;
    router.back();
  };

  const handleSubmit = async () => {
    if (!location.trim()) {
      Alert.alert('Missing Location', 'Please enter where this job is located.');
      return;
    }

    if (latitude.trim() && !Number.isFinite(Number(latitude))) {
      Alert.alert('Invalid Latitude', 'Latitude must be a number, or left blank.');
      return;
    }

    if (longitude.trim() && !Number.isFinite(Number(longitude))) {
      Alert.alert('Invalid Longitude', 'Longitude must be a number, or left blank.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/create-job.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          categoryId: params.categoryId,
          title: params.title,
          description: params.description,
          budget: params.budget,
          location: location.trim(),
          latitude: latitude.trim() || null,
          longitude: longitude.trim() || null,
          jobType: params.jobType,
          requiredSkills: params.requiredSkills,
        }),
      });

      const responseText = await response.text();
      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`The server returned an invalid response.\n\n${responseText}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to post job.');
      }

      setPosted(true);
    } catch (error: any) {
      console.error('CREATE JOB ERROR:', error);
      Alert.alert('Unable to Post Job', error?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (posted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5FFF9" />
        <View style={styles.successWrap}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Job posted!</Text>
          <Text style={styles.successSubtitle}>
            Your job is now live. Workers matching your requirements will be
            able to see it, or you can request a specific worker directly.
          </Text>
        </View>

        <Pressable
          style={styles.continueButton}
          onPress={() =>
            router.replace({
              pathname: '/employer/employer-home',
              params: { userId, fullName },
            })
          }
        >
          <Text style={styles.continueButtonText}>Back to Dashboard</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5FFF9" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Job Location</Text>
            <Text style={styles.headerSubtitle}>
              Where will "{params.title}" take place?
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Example: Barangay Lahug, Cebu City"
            placeholderTextColor="#9AA8A0"
            style={styles.input}
          />
          <Text style={styles.helperText}>
            A barangay, street, or general area is fine.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Pin Coordinates (optional)</Text>
          <View style={styles.coordRow}>
            <TextInput
              value={latitude}
              onChangeText={setLatitude}
              placeholder="Latitude"
              placeholderTextColor="#9AA8A0"
              keyboardType="numbers-and-punctuation"
              style={[styles.input, styles.coordInput]}
            />
            <TextInput
              value={longitude}
              onChangeText={setLongitude}
              placeholder="Longitude"
              placeholderTextColor="#9AA8A0"
              keyboardType="numbers-and-punctuation"
              style={[styles.input, styles.coordInput]}
            />
          </View>
          <Text style={styles.helperText}>
            Leave blank if you don't have exact coordinates — a map picker can
            be added later.
          </Text>
        </View>

        <Pressable
          style={[styles.continueButton, submitting && styles.continueButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Post Job</Text>
              <Text style={styles.continueArrow}>→</Text>
            </>
          )}
        </Pressable>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5FFF9' },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 35 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5F7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: { fontSize: 32, color: '#176B45', lineHeight: 34, marginTop: -3 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#123B2A' },
  headerSubtitle: { marginTop: 3, fontSize: 13, color: '#728078' },

  card: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEFE5',
  },
  label: { fontSize: 13, fontWeight: '800', color: '#234838', marginBottom: 9 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D6E7DE',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#263F33',
    backgroundColor: '#FBFEFC',
  },
  helperText: { marginTop: 7, fontSize: 11, lineHeight: 16, color: '#7D8A83' },

  coordRow: { flexDirection: 'row', gap: 10 },
  coordInput: { flex: 1 },

  continueButton: {
    marginHorizontal: 20,
    marginTop: 3,
    minHeight: 53,
    borderRadius: 14,
    backgroundColor: '#178A55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  continueArrow: { color: '#FFFFFF', fontSize: 22, marginLeft: 9 },

  bottomSpace: { height: 20 },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2F6EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIconText: { fontSize: 34, color: '#178A55', fontWeight: '800' },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#123B2A', marginBottom: 8 },
  successSubtitle: { fontSize: 13, color: '#728078', textAlign: 'center', lineHeight: 19 },
});