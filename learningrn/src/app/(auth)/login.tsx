import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Missing info', 'Please enter your mobile number (or admin username) and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Login failed', data.error || 'Something went wrong.');
        return;
      }

      if (data.role === 'Admin') {
        router.push('/admin/admin-dashboard');
        return;
      }

      if (!data.isVerified) {
        if (data.verificationStatus === 'Pending') {
          Alert.alert(
            'Verification pending',
            "Your account has already been submitted for verification. We'll let you know once it's reviewed by an NGO staff member or admin."
          );
          return;
        }

        if (data.verificationStatus === 'Rejected') {
          Alert.alert(
            'Verification rejected',
            'Your submitted documents were not approved. Please resubmit your ID and selfie.'
          );
          router.push({
            pathname: '/verify-identity',
            params: { userId: String(data.userId) },
          });
          return;
        }

        // 'NotSubmitted' — first time logging in, send them to upload docs
        router.push({
          pathname: '/verify-identity',
          params: { userId: String(data.userId) },
        });
        return;
      }

      if (data.role === 'Employer') {
      router.push({
        pathname: '/employer/employer-home',
        params: {
          userId: String(data.userId),
          fullName: data.fullName,
        },
      });
      return;
    }

      if (data.role === 'NGO Staff') {
        router.push({
          pathname: '/ngo/ngo-home',
          params: {
            userId: String(data.userId),
            fullName: data.fullName,
          },
        });
        return;
      }

      router.push({
        pathname: '/worker/worker-home',
        params: { userId: String(data.userId) },
      });
    } catch (err) {
      Alert.alert(
        'Connection error',
        'Could not reach the server. Make sure XAMPP (Apache + MySQL) is running.'
      );
      console.log('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Image
              source={require('../../../assets/tinabangay-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Welcome back</Text>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottom}>
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginText}>Log in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createWrap}
              onPress={() => router.push('/create-account')}
            >
              <Text style={styles.createText}>
                Don't have an account? <Text style={styles.createBold}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 24,
  },
  field: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: NAVY,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN,
  },
  bottom: {
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  loginButton: {
    backgroundColor: NAVY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createWrap: {
    paddingVertical: 4,
  },
  createText: {
    fontSize: 14,
    color: '#6B7280',
  },
  createBold: {
    fontWeight: '700',
    color: NAVY,
  },
});