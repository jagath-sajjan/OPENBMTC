import { View, Text, StyleSheet, Pressable, useWindowDimensions, Animated } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export default function OnboardingScreen() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const isSmallPhone = width < 375;
    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;

    const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : isSmallPhone ? 16 : 20;
    const titleSize = isTablet ? 48 : isSmallPhone ? 36 : 42;
    const subtitleSize = isTablet ? 20 : isSmallPhone ? 16 : 18;

    useEffect(() => {
        checkLocationPermission();
    }, []);

    useEffect(() => {
        // Re-check permission when navigating to slide 2
        if (currentSlide === 1) {
            checkLocationPermission();
        }
    }, [currentSlide]);

    const checkLocationPermission = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
    };

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
    };

    const completeOnboarding = async () => {
        await AsyncStorage.setItem('onboarding_completed', 'true');
        router.replace('/(tabs)');
    };

    const goToNextSlide = () => {
        if (currentSlide === 0) {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setCurrentSlide(1);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        } else if (currentSlide === 1) {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    return (
        <View style={styles.container}>
            {/* Decorative shapes */}
            <View style={[styles.floatingShape, styles.shape1]} />
            <View style={[styles.floatingShape, styles.shape2]} />
            <View style={[styles.floatingShape, styles.shape3]} />

            <SafeAreaView edges={['top', 'bottom'] as Edge[]} style={styles.safeArea}>
                <Animated.View style={[styles.content, { opacity: fadeAnim, paddingHorizontal: horizontalPadding }]}>
                    {currentSlide === 0 ? (
                        // Slide 1: Welcome
                        <View style={styles.slideContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="bus" size={isTablet ? 80 : 64} color="#2D3748" />
                            </View>

                            <View style={styles.textContainer}>
                                <Text style={[styles.title, { fontSize: titleSize }]}>
                                    Welcome to{'\n'}OpenBMTC
                                </Text>
                                <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
                                    A bus schedules and routes open source app for Bangalore Public Transport
                                </Text>
                            </View>

                            <View style={styles.dotsContainer}>
                                <View style={[styles.dot, styles.dotActive]} />
                                <View style={styles.dot} />
                            </View>
                        </View>
                    ) : (
                        // Slide 2: Location Permission
                        <View style={styles.slideContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: '#C7ADEB' }]}>
                                <Ionicons name="location" size={isTablet ? 80 : 64} color="#2D3748" />
                            </View>

                            <View style={styles.textContainer}>
                                <Text style={[styles.title, { fontSize: titleSize }]}>
                                    Location Access
                                </Text>
                                <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
                                    Allow location access to find nearest bus stops and get personalized routes
                                </Text>

                                {locationPermission === false && (
                                    <View style={styles.warningBox}>
                                        <Ionicons name="warning" size={20} color="#F59E0B" />
                                        <Text style={styles.warningText}>
                                            Location permission is required for the "Nearest Bus Stop" feature
                                        </Text>
                                    </View>
                                )}

                                {locationPermission === true && (
                                    <View style={styles.successBox}>
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        <Text style={styles.successText}>
                                            Location Permission Granted!
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {locationPermission !== true && (
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.permissionButton,
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={requestLocationPermission}
                                >
                                    <Ionicons name="location-outline" size={24} color="#FAF8F5" />
                                    <Text style={styles.permissionButtonText}>Allow Location Access</Text>
                                </Pressable>
                            )}

                            <View style={styles.dotsContainer}>
                                <View style={styles.dot} />
                                <View style={[styles.dot, styles.dotActive]} />
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* Bottom Navigation */}
                <View style={[
                    styles.bottomNav,
                    { paddingHorizontal: horizontalPadding },
                    currentSlide === 1 && styles.bottomNavCentered
                ]}>
                    {currentSlide === 0 && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.skipButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={handleSkip}
                        >
                            <Text style={styles.skipButtonText}>Skip</Text>
                        </Pressable>
                    )}

                    {currentSlide === 1 && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.notNowButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={handleSkip}
                        >
                            <Text style={styles.notNowText}>Not Now</Text>
                        </Pressable>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            styles.nextButton,
                            pressed && styles.buttonPressed,
                            currentSlide === 0 && { marginLeft: 'auto' }
                        ]}
                        onPress={goToNextSlide}
                    >
                        {currentSlide === 0 ? (
                            <View style={styles.circleButton}>
                                <Ionicons name="arrow-forward" size={28} color="#FAF8F5" />
                            </View>
                        ) : (
                            <View style={styles.getStartedButton}>
                                <Text style={styles.getStartedText}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FAF8F5" />
                            </View>
                        )}
                    </Pressable>
                </View>
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
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    slideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#A8E5BC',
        borderWidth: 3,
        borderColor: '#2D3748',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
    },
    textContainer: {
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 20,
    },
    title: {
        color: '#1F2937',
        fontFamily: 'Poppins_700Bold',
        textAlign: 'center',
        letterSpacing: -1,
        lineHeight: 48,
    },
    subtitle: {
        color: '#6B7280',
        fontFamily: 'Poppins_400Regular',
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 400,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FEF3C7',
        borderWidth: 2,
        borderColor: '#F59E0B',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        fontFamily: 'Poppins_500Medium',
        lineHeight: 18,
    },
    successBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#D1FAE5',
        borderWidth: 2,
        borderColor: '#10B981',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
    },
    successText: {
        flex: 1,
        fontSize: 13,
        color: '#065F46',
        fontFamily: 'Poppins_500Medium',
        lineHeight: 18,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#2D3748',
        borderWidth: 2.5,
        borderColor: '#2D3748',
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 32,
        marginTop: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    permissionButtonText: {
        fontSize: 16,
        color: '#FAF8F5',
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: -0.3,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#D1D5DB',
        borderWidth: 2,
        borderColor: '#2D3748',
    },
    dotActive: {
        backgroundColor: '#2D3748',
        width: 32,
    },
    bottomNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 32,
        paddingTop: 16,
    },
    bottomNavCentered: {
        justifyContent: 'center',
    },
    skipButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    skipButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'Poppins_600SemiBold',
    },
    notNowButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        position: 'absolute',
        top: -60,
    },
    notNowText: {
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'Poppins_600SemiBold',
    },
    nextButton: {
        // Positioning handled dynamically
    },
    circleButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2D3748',
        borderWidth: 2.5,
        borderColor: '#2D3748',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    getStartedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#2D3748',
        borderWidth: 2.5,
        borderColor: '#2D3748',
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 32,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    getStartedText: {
        fontSize: 16,
        color: '#FAF8F5',
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: -0.3,
    },
    buttonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
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
});
