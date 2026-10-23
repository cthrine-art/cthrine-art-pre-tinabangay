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
} from 'react-native';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleReset = () => {
    // TODO: hook up to your password-reset logic
    console.log('Sending reset link to', mobileOrEmail);
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Image
            source={require('../../../assets/tinabangay-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number or email and we'll send you a link to
            reset your password.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>MOBILE / EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="+63 917 000 0000"
              placeholderTextColor="#9CA3AF"
              value={mobileOrEmail}
              onChangeText={setMobileOrEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {submitted && (
            <Text style={styles.successText}>
              If an account exists, a reset link has been sent.
            </Text>
          )}
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>Send Reset Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backWrap}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.backText}>Back to log in</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  field: {
    width: '100%',
    marginBottom: 8,
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
  successText: {
    color: GREEN,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  bottom: {
    alignItems: 'center',
    gap: 16,
  },
  resetButton: {
    backgroundColor: NAVY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backWrap: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
  },
});