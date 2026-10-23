import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost/tinabangay-api'
    : 'http://10.0.2.2/tinabangay-api';

type WorkCategory = {
  id: number;
  name: string;
};

export default function VerifyIdentity() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);

  const [proofOfWorkImage, setProofOfWorkImage] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const [showCategories, setShowCategories] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const experienceOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // --------------------------------------------------
  // LOAD SERVICE CATEGORIES
  // --------------------------------------------------

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);

      const response = await fetch(
        `${API_BASE_URL}/get-service-categories.php`
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          'Invalid response while loading work categories.'
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Failed to load work categories.'
        );
      }

      setWorkCategories(data.categories || []);
    } catch (error: any) {
      console.log('Category loading error:', error);

      Alert.alert(
        'Error',
        error?.message ||
          'Could not load work categories.'
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  // --------------------------------------------------
  // PICK IMAGE
  // --------------------------------------------------

  const pickImage = async (
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    try {
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
  // ADD EXPO FILE TO FORMDATA
  // --------------------------------------------------

  const appendImage = (
    formData: FormData,
    fieldName: string,
    uri: string,
    filename: string
  ) => {
    const file = new File(uri);

    formData.append(fieldName, file);
  };

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const submitVerification = async () => {
    if (!userId) {
      Alert.alert(
        'Error',
        'User ID is missing.'
      );
      return;
    }

    if (!categoryId) {
      Alert.alert(
        'Incomplete',
        'Please select your primary type of work.'
      );
      return;
    }

    if (yearsExperience === null) {
      Alert.alert(
        'Incomplete',
        'Please select your years of experience.'
      );
      return;
    }

    if (!proofOfWorkImage) {
      Alert.alert(
        'Incomplete',
        'Please upload proof of your work.'
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

      // Basic information
      formData.append(
        'userId',
        String(userId)
      );

      formData.append(
        'categoryId',
        String(categoryId)
      );

      formData.append(
        'yearsExperience',
        String(yearsExperience)
      );

      // Files
      appendImage(
        formData,
        'idImage',
        idImage,
        'valid_id.jpg'
      );

      appendImage(
        formData,
        'selfieImage',
        selfieImage,
        'selfie.jpg'
      );

      appendImage(
        formData,
        'proofOfWork',
        proofOfWorkImage,
        'proof_of_work.jpg'
      );

      console.log(
        'Submitting verification...'
      );

      console.log(
        'userId:',
        userId
      );

      console.log(
        'categoryId:',
        categoryId
      );

      console.log(
        'yearsExperience:',
        yearsExperience
      );

      console.log(
        'idImage:',
        idImage
      );

      console.log(
        'selfieImage:',
        selfieImage
      );

      console.log(
        'proofOfWork:',
        proofOfWorkImage
      );

      const response = await fetch(
        `${API_BASE_URL}/upload-verification.php`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const rawText =
        await response.text();

      console.log(
        'PHP response:',
        rawText
      );

      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Invalid server response: ${rawText}`
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'Failed to submit worker verification.'
        );
      }

      Alert.alert(
        'Verification Submitted',
        'Your worker verification has been submitted successfully. Please wait for the verification review.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.replace('/(auth)');
            },
          },
        ]
      );

    } catch (error: any) {
      console.log(
        'Verification submission error:',
        error
      );

      Alert.alert(
        'Submission Failed',
        error?.message ||
          'Something went wrong while submitting your verification.'
      );

    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory =
    workCategories.find(
      (item) => item.id === categoryId
    );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >

      <Text style={styles.title}>
        Worker Verification
      </Text>

      <Text style={styles.subtitle}>
        Please provide the information and documents needed to
        verify your worker account.
      </Text>

      {/* CATEGORY */}

      <Text style={styles.label}>
        Primary Type of Work
      </Text>

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() =>
          setShowCategories(
            !showCategories
          )
        }
        disabled={loadingCategories}
      >

        {loadingCategories ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator
              size="small"
            />

            <Text style={styles.placeholder}>
              Loading work categories...
            </Text>
          </View>
        ) : (
          <Text
            style={
              selectedCategory
                ? styles.selectedText
                : styles.placeholder
            }
          >
            {selectedCategory
              ? selectedCategory.name
              : 'Select your type of work'}
          </Text>
        )}

        <Text style={styles.arrow}>
          {showCategories
            ? '▲'
            : '▼'}
        </Text>

      </TouchableOpacity>

      {showCategories &&
        !loadingCategories && (
          <View
            style={styles.dropdownList}
          >

            {workCategories.length === 0 ? (
              <Text style={styles.emptyText}>
                No work categories available.
              </Text>
            ) : (
              workCategories.map(
                (category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={
                      styles.dropdownItem
                    }
                    onPress={() => {
                      setCategoryId(
                        category.id
                      );

                      setShowCategories(
                        false
                      );
                    }}
                  >

                    <Text
                      style={
                        styles.dropdownItemText
                      }
                    >
                      {category.name}
                    </Text>

                  </TouchableOpacity>
                )
              )
            )}

          </View>
        )}

      {/* EXPERIENCE */}

      <Text style={styles.label}>
        Years of Experience
      </Text>

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() =>
          setShowExperience(
            !showExperience
          )
        }
      >

        <Text
          style={
            yearsExperience !== null
              ? styles.selectedText
              : styles.placeholder
          }
        >
          {yearsExperience !== null
            ? `${yearsExperience} ${
                yearsExperience === 1
                  ? 'year'
                  : 'years'
              }`
            : 'Select years of experience'}
        </Text>

        <Text style={styles.arrow}>
          {showExperience
            ? '▲'
            : '▼'}
        </Text>

      </TouchableOpacity>

      {showExperience && (
        <View
          style={styles.dropdownList}
        >

          {experienceOptions.map(
            (years) => (
              <TouchableOpacity
                key={years}
                style={
                  styles.dropdownItem
                }
                onPress={() => {
                  setYearsExperience(
                    years
                  );

                  setShowExperience(
                    false
                  );
                }}
              >

                <Text
                  style={
                    styles.dropdownItemText
                  }
                >
                  {years}{' '}
                  {years === 1
                    ? 'year'
                    : 'years'}
                </Text>

              </TouchableOpacity>
            )
          )}

        </View>
      )}

      {/* PROOF OF WORK */}

      <Text style={styles.label}>
        Proof of Work
      </Text>

      <Text style={styles.helperText}>
        Upload a photo showing your previous
        work or completed project.
      </Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={() =>
          pickImage(
            setProofOfWorkImage
          )
        }
      >

        {proofOfWorkImage ? (
          <Image
            source={{
              uri: proofOfWorkImage,
            }}
            style={styles.preview}
          />
        ) : (
          <>
            <Text
              style={styles.uploadIcon}
            >
              📷
            </Text>

            <Text
              style={styles.uploadText}
            >
              Upload Proof of Work
            </Text>

            <Text
              style={styles.uploadSubtext}
            >
              Tap to select a photo
            </Text>
          </>
        )}

      </TouchableOpacity>

      {/* VALID ID */}

      <Text style={styles.label}>
        Valid ID
      </Text>

      <Text style={styles.helperText}>
        Upload a clear photo of your valid
        government-issued ID.
      </Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={() =>
          pickImage(setIdImage)
        }
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
            <Text
              style={styles.uploadIcon}
            >
              🪪
            </Text>

            <Text
              style={styles.uploadText}
            >
              Upload Valid ID
            </Text>

            <Text
              style={styles.uploadSubtext}
            >
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
        Take a clear selfie for identity
        verification.
      </Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={takeSelfie}
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
            <Text
              style={styles.uploadIcon}
            >
              🤳
            </Text>

            <Text
              style={styles.uploadText}
            >
              Take Selfie
            </Text>

            <Text
              style={styles.uploadSubtext}
            >
              Tap to open the camera
            </Text>
          </>
        )}

      </TouchableOpacity>

      {/* SUBMIT */}

      <TouchableOpacity
        style={[
          styles.submitButton,
          submitting &&
            styles.disabledButton,
        ]}
        onPress={submitVerification}
        disabled={submitting}
      >

        {submitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator
              color="#fff"
            />

            <Text
              style={styles.submitText}
            >
              Submitting...
            </Text>
          </View>
        ) : (
          <Text
            style={styles.submitText}
          >
            Submit Verification
          </Text>
        )}

      </TouchableOpacity>

      <Text style={styles.note}>
        Your documents will be reviewed before
        your worker account receives a
        verification badge.
      </Text>

    </ScrollView>
  );
}

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

  dropdown: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d5d5d5',
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },

  selectedText: {
    color: '#222',
    fontSize: 15,
    flex: 1,
  },

  placeholder: {
    color: '#999',
    fontSize: 15,
    flex: 1,
  },

  arrow: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
  },

  dropdownList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginTop: 5,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  dropdownItemText: {
    fontSize: 15,
    color: '#222',
  },

  emptyText: {
    padding: 15,
    color: '#777',
    textAlign: 'center',
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