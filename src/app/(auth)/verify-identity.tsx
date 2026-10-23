import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

export default function VerifyIdentityScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pickIdImage = async () => {
    setErrorMessage('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Please allow access to your photos to upload an ID.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      setIdImage(result.assets[0].uri);
    }
  };

  const takeSelfie = async () => {
    setErrorMessage('');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Please allow camera access to take a selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelfieImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!idImage || !selfieImage) {
      setErrorMessage('Please upload a valid ID and take a selfie before submitting.');
      return;
    }

    if (!userId) {
      setErrorMessage('No user ID was passed to this screen — go back and create your account again.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('userId', userId);

      const idBlob = await (await fetch(idImage)).blob();
      const selfieBlob = await (await fetch(selfieImage)).blob();
      formData.append('idImage', idBlob, 'id.jpg');
      formData.append('selfieImage', selfieBlob, 'selfie.jpg');

      const response = await fetch(`${API_BASE_URL}/upload-verification.php`, {
        method: 'POST',
        body: formData,
      });

      const rawText = await response.text();
      console.log('RAW RESPONSE TEXT:', rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        setErrorMessage(`Server did not return valid JSON. Raw response: ${rawText.substring(0, 300)}`);
        return;
      }

      if (!response.ok) {
        setErrorMessage(data.error || 'Something went wrong.');
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        `Could not reach the server. Details: ${err?.message || String(err)}`
      );
      console.log('Upload error name:', err?.name);
      console.log('Upload error message:', err?.message);
      console.log('Upload error full:', JSON.stringify(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
          </View>
          <Text style={styles.title}>Submitted for review</Text>
          <Text style={styles.subtitle}>
            Your documents were sent successfully. An admin or NGO staff
            member will review them — this usually takes 1-2 business days.
            You'll be notified once your account is verified.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => router.push('/' as any)}
        >
          <Text style={styles.submitText}>Back to home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#2E7D32" />
        </View>

        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>
          Upload a valid government ID and a live selfie.
        </Text>

        <TouchableOpacity style={styles.uploadBox} onPress={pickIdImage}>
          <View style={styles.uploadLeft}>
            <Ionicons name="cloud-upload-outline" size={20} color={NAVY} />
            <Text style={styles.uploadLabel}>
              {idImage ? 'ID selected ✓' : 'Upload valid ID'}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>JPG/PNG</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBox} onPress={takeSelfie}>
          <View style={styles.uploadLeft}>
            <Ionicons name="cloud-upload-outline" size={20} color={NAVY} />
            <Text style={styles.uploadLabel}>
              {selfieImage ? 'Selfie captured ✓' : 'Take live selfie'}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CAMERA</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.noticeBox}>
          <Ionicons name="lock-closed-outline" size={16} color="#B45309" />
          <Text style={styles.noticeText}>
            Reviewed manually by admin or NGO staff.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>Submit for review</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const NAVY = '#0F1F3D';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EAF6EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  uploadBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  uploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#FEF9E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#B45309',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  successContent: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 12,
  },
  successIconWrap: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: NAVY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});