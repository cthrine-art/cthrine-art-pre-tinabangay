import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

type Worker = {
  id: number;
  name: string;
  service: string;
  skills: string[];
  location: string;
  rating: number;
  available: boolean;
};

const workers: Worker[] = [
  {
    id: 1,
    name: 'Juan Dela Cruz',
    service: 'Carpentry',
    skills: ['Framing', 'Sanding', 'Woodwork'],
    location: 'Valencia, Cebu',
    rating: 4.8,
    available: true,
  },
  {
    id: 2,
    name: 'Pedro Santos',
    service: 'Masonry',
    skills: ['Concrete Work', 'Painting'],
    location: 'Alegria, Cebu',
    rating: 4.6,
    available: true,
  },
  {
    id: 3,
    name: 'Maria Garcia',
    service: 'House Cleaning',
    skills: ['Cleaning', 'Laundry'],
    location: 'Cebu',
    rating: 4.9,
    available: false,
  },
];

export default function FindWorkersScreen() {
  const router = useRouter();

  /*
   * Employer information passed from Employer Dashboard
   */
  const {
    userId,
    fullName,
  } = useLocalSearchParams<{
    userId?: string;
    fullName?: string;
  }>();

  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const filteredWorkers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return workers.filter((worker) => {
      const matchesSearch =
        searchText.length === 0 ||
        worker.name.toLowerCase().includes(searchText) ||
        worker.service.toLowerCase().includes(searchText) ||
        worker.skills.some((skill) =>
          skill.toLowerCase().includes(searchText)
        ) ||
        worker.location.toLowerCase().includes(searchText);

      const matchesAvailability =
        !availableOnly || worker.available;

      return matchesSearch && matchesAvailability;
    });
  }, [search, availableOnly]);

  /*
   * Open the selected worker's profile
   *
   * We pass:
   * 1. Employer userId
   * 2. Employer fullName
   * 3. Selected workerId
   */
  const openWorkerProfile = (worker: Worker) => {
    router.push({
      pathname: '/employer/worker-profile' as any,
      params: {
        userId: userId || '',
        fullName: fullName || 'Employer',
        workerId: String(worker.id),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FAF7F2"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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
            Find Workers
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Intro */}
        <Text style={styles.pageTitle}>
          Find the right worker
        </Text>

        <Text style={styles.subtitle}>
          Search workers by name, service, skills, or
          location.
        </Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#7A8289"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search workers or skills"
            placeholderTextColor="#8B9298"
            value={search}
            onChangeText={setSearch}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color="#A0A6AB"
              />
            </Pressable>
          )}
        </View>

        {/* Availability Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterTitle}>
            Filter
          </Text>

          <Pressable
            style={[
              styles.filterButton,
              availableOnly &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setAvailableOnly(
                (previous) => !previous
              )
            }
          >
            <Ionicons
              name={
                availableOnly
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              size={16}
              color={
                availableOnly
                  ? '#FFFFFF'
                  : GREEN
              }
            />

            <Text
              style={[
                styles.filterText,
                availableOnly &&
                  styles.filterTextActive,
              ]}
            >
              Available only
            </Text>
          </Pressable>
        </View>

        {/* Result Count */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            Workers
          </Text>

          <Text style={styles.resultCount}>
            {filteredWorkers.length} found
          </Text>
        </View>

        {/* Worker List */}
        {filteredWorkers.length > 0 ? (
          filteredWorkers.map((worker) => (
            <Pressable
              key={worker.id}
              style={({ pressed }) => [
                styles.workerCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                openWorkerProfile(worker)
              }
            >
              {/* Worker Header */}
              <View style={styles.workerHeader}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.avatarText}>
                    {worker.name.charAt(0)}
                  </Text>
                </View>

                <View style={styles.workerMain}>
                  <View style={styles.nameRow}>
                    <Text style={styles.workerName}>
                      {worker.name}
                    </Text>

                    {worker.available && (
                      <View
                        style={
                          styles.availableBadge
                        }
                      >
                        <View
                          style={
                            styles.availableDot
                          }
                        />

                        <Text
                          style={
                            styles.availableText
                          }
                        >
                          Available
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.service}>
                    {worker.service}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#8A9197"
                />
              </View>

              {/* Skills */}
              <View style={styles.skillsContainer}>
                {worker.skills.map((skill) => (
                  <View
                    key={skill}
                    style={styles.skillBadge}
                  >
                    <Text style={styles.skillText}>
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Worker Details */}
              <View style={styles.workerDetails}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color="#6F777D"
                  />

                  <Text style={styles.detailText}>
                    {worker.location}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons
                    name="star"
                    size={15}
                    color="#D49A25"
                  />

                  <Text style={styles.detailText}>
                    {worker.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* View Profile */}
              <View style={styles.profileButton}>
                <Text
                  style={
                    styles.profileButtonText
                  }
                >
                  View Profile
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={NAVY}
                />
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={32}
                color="#8A9197"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No workers found
            </Text>

            <Text style={styles.emptyMessage}>
              Try another name, service, skill, or
              location.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const NAVY = '#0F1F3D';
const GREEN = '#2E7D32';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NAVY,
  },

  headerSpacer: {
    width: 40,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
    marginTop: 8,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 11,
    lineHeight: 17,
    color: '#7A8289',
    marginBottom: 18,
  },

  searchContainer: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1DB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 12,
    color: '#26343F',
    marginLeft: 9,
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  filterTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7E5D9',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  filterButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },

  filterText: {
    fontSize: 10,
    fontWeight: '600',
    color: GREEN,
    marginLeft: 5,
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },

  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
  },

  resultCount: {
    fontSize: 10,
    color: '#7A8289',
  },

  workerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  cardPressed: {
    opacity: 0.85,
  },

  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  workerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAF5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },

  workerMain: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },

  workerName: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
    marginRight: 7,
  },

  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EC',
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  availableDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: GREEN,
    marginRight: 4,
  },

  availableText: {
    fontSize: 7,
    fontWeight: '700',
    color: GREEN,
  },

  service: {
    fontSize: 10,
    color: '#6F777D',
  },

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 13,
    gap: 6,
  },

  skillBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  skillText: {
    fontSize: 8,
    color: '#59636B',
    fontWeight: '600',
  },

  workerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    gap: 18,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailText: {
    fontSize: 9,
    color: '#6F777D',
    marginLeft: 5,
  },

  profileButton: {
    height: 36,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F2',
    marginTop: 13,
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: NAVY,
    marginRight: 5,
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E5DF',
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F2F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 5,
  },

  emptyMessage: {
    fontSize: 10,
    color: '#7A8289',
    textAlign: 'center',
    lineHeight: 16,
  },
});