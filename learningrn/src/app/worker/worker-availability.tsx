import React, { useState } from 'react';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function WorkerAvailabilityScreen() {
  const router = useRouter();

  const [isAvailable, setIsAvailable] = useState(true);

  const toggleAvailability = () => {
    setIsAvailable((previous) => !previous);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={NAVY}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Availability
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>

          {/* ICON */}
          <View style={styles.mainIcon}>
            <Ionicons
              name="calendar-outline"
              size={42}
              color={GREEN}
            />
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            Your Availability
          </Text>

          <Text style={styles.subtitle}>
            Let employers know if you are currently available
            to accept job opportunities.
          </Text>

          {/* AVAILABILITY CARD */}
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.statusIcon,
                  isAvailable
                    ? styles.availableIcon
                    : styles.unavailableIcon,
                ]}
              >
                <Ionicons
                  name={
                    isAvailable
                      ? 'checkmark'
                      : 'close'
                  }
                  size={20}
                  color={
                    isAvailable
                      ? GREEN
                      : '#8A8F94'
                  }
                />
              </View>

              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {isAvailable
                    ? 'Available'
                    : 'Not Available'}
                </Text>

                <Text style={styles.statusDescription}>
                  {isAvailable
                    ? 'You are currently available for work.'
                    : 'You are currently not available for work.'}
                </Text>
              </View>
            </View>

            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              trackColor={{
                false: '#D9DEE2',
                true: '#A9D2B0',
              }}
              thumbColor={
                isAvailable
                  ? GREEN
                  : '#FFFFFF'
              }
            />
          </View>

          {/* INFORMATION */}
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={GREEN}
            />

            <Text style={styles.infoText}>
              When your availability is turned off,
              employers will see that you are not
              currently available for job opportunities.
            </Text>
          </View>

          {/* CURRENT STATUS */}
          <View style={styles.currentStatus}>
            <Text style={styles.currentStatusLabel}>
              CURRENT STATUS
            </Text>

            <Text
              style={[
                styles.currentStatusValue,
                isAvailable
                  ? styles.availableText
                  : styles.unavailableText,
              ]}
            >
              {isAvailable
                ? 'AVAILABLE'
                : 'NOT AVAILABLE'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const NAVY = '#2E7D32';
const GREEN = '#2E7D32';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  /* HEADER */
  header: {
    height: 65,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F3',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#162C3D',
  },

  headerSpacer: {
    width: 40,
  },

  /* CONTENT */
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  /* MAIN ICON */
  mainIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },

  /* TITLE */
  title: {
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '700',
    color: '#162C3D',
    marginBottom: 8,
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8289',
    marginBottom: 30,
    paddingHorizontal: 15,
  },

  /* AVAILABILITY CARD */
  card: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#E2E7EA',
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },

  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  availableIcon: {
    backgroundColor: '#EAF5EC',
  },

  unavailableIcon: {
    backgroundColor: '#F1F2F3',
  },

  statusTextContainer: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#162C3D',
    marginBottom: 4,
  },

  statusDescription: {
    fontSize: 10,
    color: '#7A8289',
  },

  /* INFORMATION */
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F9F6',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 10,
    lineHeight: 16,
    color: '#59666F',
  },

  /* CURRENT STATUS */
  currentStatus: {
    marginTop: 30,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F3',
    alignItems: 'center',
  },

  currentStatusLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7A8289',
    letterSpacing: 0.5,
    marginBottom: 7,
  },

  currentStatusValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  availableText: {
    color: GREEN,
  },

  unavailableText: {
    color: '#8A8F94',
  },
});
