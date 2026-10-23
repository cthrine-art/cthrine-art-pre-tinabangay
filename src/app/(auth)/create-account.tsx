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

type Role = 'WORKER' | 'EMPLOYER' | 'NGO';

const API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost/tinabangay-api' : 'http://10.0.2.2/tinabangay-api';

export default function CreateAccountScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('WORKER');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!fullName.trim() || !email.trim() || !mobileNumber.trim() || !password) {
      Alert.alert('Missing info', 'Please fill in your name, email, mobile number, and password.');
      return;
    }

    if (role === 'NGO') {
      Alert.alert(
        'NGO registration not available yet',
        'NGO staff accounts are created differently — this will be added later.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          mobileNumber: mobileNumber.trim(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Could not create account', data.error || 'Something went wrong.');
        return;
      }

      Alert.alert('Account created', 'Your account is pending verification.');
      router.push({
        pathname: '/verify-identity',
        params: { userId: String(data.userId) },
      });
    } catch (err) {
      Alert.alert(
        'Connection error',
        'Could not reach the server. Make sure XAMPP (Apache + MySQL) is running.'
      );
      console.log('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  const roles: Role[] = ['WORKER', 'EMPLOYER', 'NGO'];

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

            <Text style={styles.title}>Create your account</Text>

            <View style={styles.field}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Dela Cruz"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="juan@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>MOBILE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="+63 917 000 0000"
                placeholderTextColor="#9CA3AF"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.roleGroup}>
              {roles.map((r) => {
                const selected = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleButton, selected && styles.roleButtonSelected]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[styles.roleText, selected && styles.roleTextSelected]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Create password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.bottom}>
            <TouchableOpacity
              style={[styles.continueButton, loading && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueText}>Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginWrap}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginBold}>Log in</Text>
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
  roleGroup: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleButtonSelected: {
    borderColor: GREEN,
    backgroundColor: '#F0FDF4',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  roleTextSelected: {
    color: GREEN,
  },
  bottom: {
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  continueButton: {
    backgroundColor: NAVY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginWrap: {
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginBold: {
    fontWeight: '700',
    color: NAVY,
  },
});