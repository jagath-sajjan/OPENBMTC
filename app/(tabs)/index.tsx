import { View, Text, Pressable, StyleSheet, Dimensions, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [greeting, setGreeting] = useState('Good evening');
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const router = useRouter();

  // Check location permission
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setHasLocationPermission(status === 'granted');
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(status === 'granted');
  };

  // Get time-based greeting (IST)
  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      // Convert to IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      const hour = istTime.getUTCHours();

      if (hour >= 5 && hour < 12) {
        setGreeting('Good morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good afternoon');
      } else if (hour >= 17 && hour < 21) {
        setGreeting('Good evening');
      } else {
        setGreeting('Good night');
      }
    };

    updateGreeting();
    // Update every minute
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Responsive calculations
  const isSmallPhone = width < 375;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  // Dynamic spacing
  const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : isSmallPhone ? 16 : 20;
  const cardGap = isTablet ? 20 : isSmallPhone ? 12 : 16;
  const headerPaddingBottom = isTablet ? 32 : 24;

  // Dynamic card heights
  const largeCardHeight = isTablet ? 160 : isSmallPhone ? 120 : 140;
  const smallCardHeight = isTablet ? 180 : isSmallPhone ? 150 : 165;

  // Dynamic font sizes
  const titleSize = isTablet ? 44 : isSmallPhone ? 32 : 38;
  const cardTitleSize = isTablet ? 24 : isSmallPhone ? 18 : 20;
  const cardTitleSmallSize = isTablet ? 20 : isSmallPhone ? 16 : 18;

  return (
    <View style={styles.container}>
      {/* Decorative floating shapes */}
      <View style={[styles.floatingShape, styles.shape1]} />
      <View style={[styles.floatingShape, styles.shape2]} />
      <View style={[styles.floatingShape, styles.shape3]} />

      <SafeAreaView edges={['top'] as Edge[]} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: (Platform.OS === 'ios' ? 90 : 85) + insets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, {
            paddingHorizontal: horizontalPadding,
            paddingBottom: headerPaddingBottom
          }]}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={[styles.title, { fontSize: titleSize }]}>OpenBMTC</Text>
            <Text style={styles.subtitle}>Bangalore Public Transport</Text>
          </View>

          {/* Cards Container */}
          <View style={[styles.cardsContainer, {
            paddingHorizontal: horizontalPadding,
            gap: cardGap
          }]}>
            {/* Search Stops Card */}
            <Pressable
              style={({ pressed }) => [
                styles.cardLarge,
                { height: largeCardHeight },
                pressed && styles.cardPressed
              ]}
            >
              <View style={styles.cardInner}>
                <View style={[styles.iconContainer, { backgroundColor: '#A8E5BC' }]}>
                  <Ionicons name="search" size={isTablet ? 32 : 26} color="#2D3748" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { fontSize: cardTitleSize }]}>Search Stops</Text>
                  <Text style={styles.cardDescription}>Find nearby bus stops</Text>
                </View>
              </View>
            </Pressable>

            {/* Two Column Cards */}
            <View style={[styles.rowContainer, { gap: cardGap }]}>
              {/* Search Routes Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.cardSmall,
                  { height: smallCardHeight },
                  pressed && styles.cardPressed
                ]}
                onPress={() => router.push('/search-routes')}
              >
                <View style={styles.cardInnerSmall}>
                  <View style={[styles.iconContainerSmall, { backgroundColor: '#FFA776' }]}>
                    <Ionicons name="bus" size={isTablet ? 28 : 24} color="#2D3748" />
                  </View>
                  <View style={styles.cardTextContainerSmall}>
                    <Text style={[styles.cardTitleSmall, { fontSize: cardTitleSmallSize }]}>Search{'\n'}Routes</Text>
                    <Text style={styles.cardDescriptionSmall}>Find routes</Text>
                  </View>
                </View>
              </Pressable>

              {/* Route Path Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.cardSmall,
                  { height: smallCardHeight },
                  pressed && styles.cardPressed
                ]}
              >
                <View style={styles.cardInnerSmall}>
                  <View style={[styles.iconContainerSmall, { backgroundColor: '#FFA89A' }]}>
                    <MaterialCommunityIcons name="map-marker-path" size={isTablet ? 28 : 24} color="#2D3748" />
                  </View>
                  <View style={styles.cardTextContainerSmall}>
                    <Text style={[styles.cardTitleSmall, { fontSize: cardTitleSmallSize }]}>Route{'\n'}Path</Text>
                    <Text style={styles.cardDescriptionSmall}>Plan journey</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Nearest Bus Stop Card */}
            <Pressable
              style={({ pressed }) => [
                styles.cardLarge,
                { height: largeCardHeight },
                !hasLocationPermission && styles.cardDisabled,
                pressed && styles.cardPressed
              ]}
              onPress={hasLocationPermission ? undefined : requestLocationPermission}
            >
              <View style={styles.cardInner}>
                <View style={[styles.iconContainer, { backgroundColor: '#C7ADEB' }]}>
                  <Ionicons name="location" size={isTablet ? 32 : 26} color="#2D3748" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { fontSize: cardTitleSize }]}>Nearest Bus Stop</Text>
                  <Text style={styles.cardDescription}>
                    {hasLocationPermission ? 'Based on your location' : 'Location permission required'}
                  </Text>
                </View>
                {!hasLocationPermission && (
                  <View style={styles.lockIcon}>
                    <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                  </View>
                )}
              </View>
            </Pressable>

            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>250+</Text>
                <Text style={styles.statLabel}>Routes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>6000+</Text>
                <Text style={styles.statLabel}>Bus Stops</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Service</Text>
              </View>
            </View>

            {/* Credit */}
            <View style={styles.creditContainer}>
              <Text style={styles.creditText}>created by jagath-sajjan </Text>
              <Text style={styles.creditHeart}>♥</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 4,
  },
  title: {
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 2,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  cardsContainer: {
    paddingTop: 8,
  },
  cardLarge: {
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#2D3748',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSmall: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#2D3748',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  cardInnerSmall: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#2D3748',
  },
  iconContainerSmall: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#2D3748',
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTextContainerSmall: {
    marginTop: 8,
  },
  cardTitle: {
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 2,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  cardTitleSmall: {
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  cardDescriptionSmall: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 15,
  },
  rowContainer: {
    flexDirection: 'row',
  },
  // Decorative floating shapes
  floatingShape: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.04,
  },
  shape1: {
    width: 200,
    height: 200,
    backgroundColor: '#A8E5BC',
    top: -50,
    right: -50,
  },
  shape2: {
    width: 150,
    height: 150,
    backgroundColor: '#FFA776',
    top: '40%',
    left: -60,
  },
  shape3: {
    width: 180,
    height: 180,
    backgroundColor: '#C7ADEB',
    bottom: '20%',
    right: -70,
  },
  // Stats card
  statsCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#2D3748',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  creditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  creditText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
  creditHeart: {
    fontSize: 12,
    color: '#EF4444',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  lockIcon: {
    marginLeft: 8,
  },
});
