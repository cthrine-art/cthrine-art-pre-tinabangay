import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

const VERIFICATION_URL =
  `${API_BASE_URL}/upload-employer-verification.php`;

export default function VerifyEmployerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [employerName, setEmployerName] = useState('');
  const [address, setAddress] = useState('');

  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --------------------------------------------------
  // PICK IMAGE
  // --------------------------------------------------

  const pickImage = async (
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    try {
      setErrorMessage('');

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        setter(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Image picker error:', error);

      Alert.alert(
        'Error',
        'Unable to select image.'
      );
    }
  };

  // --------------------------------------------------
  // TAKE SELFIE
  // --------------------------------------------------

  const takeSelfie = async () => {
    try {
      setErrorMessage('');

      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take a selfie.'
        );
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          cameraType: ImagePicker.CameraType.front,
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        setSelfieImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Camera error:', error);

      Alert.alert(
        'Error',
        'Unable to open camera.'
      );
    }
  };

  // --------------------------------------------------
  // SUBMIT VERIFICATION
  // --------------------------------------------------

  const submitVerification = async () => {
    setErrorMessage('');

    if (!userId) {
      Alert.alert(
        'Error',
        'User ID is missing.'
      );
      return;
    }

    if (!employerName.trim()) {
      Alert.alert(
        'Incomplete',
        'Please enter your employer name.'
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        'Incomplete',
        'Please enter your complete address.'
      );
      return;
    }

    if (!idImage) {
      Alert.alert(
        'Incomplete',
        'Please upload a valid ID.'
      );
      return;
    }

    if (!selfieImage) {
      Alert.alert(
        'Incomplete',
        'Please take a selfie.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      // --------------------------------------------------
      // BASIC INFORMATION
      // --------------------------------------------------

      formData.append(
        'userId',
        String(userId)
      );

      formData.append(
        'employerName',
        employerName.trim()
      );

      formData.append(
        'address',
        address.trim()
      );

      // --------------------------------------------------
      // FILES
      // Use Expo File API
      // --------------------------------------------------

      const idFile = new File(idImage);
      const selfieFile = new File(selfieImage);

      formData.append(
        'idImage',
        idFile
      );

      formData.append(
        'selfieImage',
        selfieFile
      );

      console.log('--------------------------------');
      console.log('Submitting employer verification...');
      console.log('User ID:', userId);
      console.log('Employer Name:', employerName);
      console.log('Address:', address);
      console.log('ID Image:', idImage);
      console.log('Selfie:', selfieImage);
      console.log('API:', VERIFICATION_URL);
      console.log('--------------------------------');

      const response = await expoFetch(
        VERIFICATION_URL,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        }
      );

      console.log(
        'HTTP STATUS:',
        response.status
      );

      const rawText =
        await response.text();

      console.log(
        'SERVER RESPONSE:',
        rawText
      );

      let data: any;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Server did not return valid JSON.\n\nResponse:\n${rawText}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Server returned HTTP ${response.status}.`
        );
      }

      if (!data.success) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Employer verification upload failed.'
        );
      }

      console.log(
        'EMPLOYER VERIFICATION SUCCESS:',
        data
      );

      Alert.alert(
        'Verification Submitted',
        'Your employer verification has been submitted successfully. Please wait for the verification review.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        'Employer verification error:',
        error
      );

      const message =
        error?.message ||
        'Something went wrong while submitting your verification.';

      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* TITLE */}

      <Text style={styles.title}>
        Employer Verification
      </Text>

      <Text style={styles.subtitle}>
        Please provide the information and documents needed to
        verify your employer account.
      </Text>

      {/* EMPLOYER NAME */}

      <Text style={styles.label}>
        Employer Name
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        placeholderTextColor="#999"
        value={employerName}
        onChangeText={setEmployerName}
        editable={!submitting}
      />

      {/* ADDRESS */}

      <Text style={styles.label}>
        Address
      </Text>

      <Text style={styles.helperText}>
        Enter your complete current address.
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.addressInput,
        ]}
        placeholder="Enter your complete address"
        placeholderTextColor="#999"
        value={address}
        onChangeText={setAddress}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        editable={!submitting}
      />

      {/* VALID ID */}

      <Text style={styles.label}>
        Valid ID
      </Text>

      <Text style={styles.helperText}>
        Upload a clear photo of your valid government-issued ID.
      </Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={() =>
          pickImage(setIdImage)
        }
        disabled={submitting}
      >
        {idImage ? (
          <Image
            source={{
              uri: idImage,
            }}
            style={styles.preview}
          />
        ) : (
          <>
            <Text style={styles.uploadIcon}>
              🪪
            </Text>

            <Text style={styles.uploadText}>
              Upload Valid ID
            </Text>

            <Text style={styles.uploadSubtext}>
              Tap to select a photo
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* SELFIE */}

      <Text style={styles.label}>
        Selfie Verification
      </Text>

      <Text style={styles.helperText}>
        Take a clear selfie for identity verification.
      </Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={takeSelfie}
        disabled={submitting}
      >
        {selfieImage ? (
          <Image
            source={{
              uri: selfieImage,
            }}
            style={styles.preview}
          />
        ) : (
          <>
            <Text style={styles.uploadIcon}>
              🤳
            </Text>

            <Text style={styles.uploadText}>
              Take Selfie
            </Text>

            <Text style={styles.uploadSubtext}>
              Tap to open the camera
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ERROR */}

      {errorMessage !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        </View>
      )}

      {/* SUBMIT */}

      <TouchableOpacity
        style={[
          styles.submitButton,
          submitting && styles.disabledButton,
        ]}
        onPress={submitVerification}
        disabled={submitting}
      >
        {submitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator
              color="#fff"
            />

            <Text style={styles.submitText}>
              Submitting...
            </Text>
          </View>
        ) : (
          <Text style={styles.submitText}>
            Submit Verification
          </Text>
        )}
      </TouchableOpacity>

      {/* NOTE */}

      <Text style={styles.note}>
        Your information and uploaded documents will be reviewed
        before your employer account receives a verification badge.
      </Text>
    </ScrollView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  content: {
    padding: 24,
    paddingBottom: 50,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#222',
  },

  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 28,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
    marginTop: 18,
  },

  helperText: {
    fontSize: 13,
    color: '#777',
    marginBottom: 10,
    lineHeight: 19,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d5d5d5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fafafa',
  },

  addressInput: {
    minHeight: 90,
    paddingTop: 14,
  },

  uploadBox: {
    height: 190,
    borderWidth: 1,
    borderColor: '#d5d5d5',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },

  uploadIcon: {
    fontSize: 36,
    marginBottom: 10,
  },

  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  uploadSubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },

  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  errorBox: {
    marginTop: 20,
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F3B6B6',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  errorIcon: {
    fontSize: 18,
    marginRight: 9,
  },

  errorText: {
    flex: 1,
    color: '#C62828',
    fontSize: 13,
    lineHeight: 19,
  },

  submitButton: {
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  note: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
  },
});