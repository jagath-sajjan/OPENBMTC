import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import Slider from '@react-native-community/slider';
import { getAllStops } from '../utils/api';
import type { Stop } from '../types/database';

const MIN_KM = 5;
const MAX_KM = 12;
const STEP_KM = 1;

const formatKm = (value: number) => `${Math.round(value)}`;

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
};

type StopDistance = {
    stop: Stop;
    distanceKm: number;
};

export default function NearestStopsScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [radiusKm, setRadiusKm] = useState(MIN_KM);
    const [loading, setLoading] = useState(false);
    const [loadingStops, setLoadingStops] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [stopsWithDistance, setStopsWithDistance] = useState<StopDistance[]>([]);

    const isSmallPhone = width < 375;
    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;

    const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : isSmallPhone ? 16 : 20;
    const titleSize = isTablet ? 44 : isSmallPhone ? 32 : 38;

    useEffect(() => {
        checkPermissionAndLoad();
    }, []);

    const checkPermissionAndLoad = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        const granted = status === 'granted';
        setHasPermission(granted);

        if (granted) {
            await loadLocationAndStops();
        }
    };

    const requestPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
        setHasPermission(granted);
        if (granted) {
            await loadLocationAndStops();
        }
    };

    const loadLocationAndStops = async () => {
        setLoading(true);
        setError(null);
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setUserLocation(coords);

            setLoadingStops(true);
            const allStops = await getAllStops();
            const computed = allStops
                .filter(stop => stop.geometry?.coordinates || stop.location?.coordinates)
                .map(stop => {
                    const coordsArray = (stop.geometry?.coordinates || stop.location?.coordinates) as number[];
                    const [lon, lat] = coordsArray;
                    const distanceKm = haversineKm(coords.latitude, coords.longitude, lat, lon);
                    return { stop, distanceKm };
                })
                .sort((a, b) => a.distanceKm - b.distanceKm);

            setStopsWithDistance(computed);
        } catch (err) {
            console.error('Error loading nearest stops:', err);
            setError('Failed to load nearby stops');
        } finally {
            setLoading(false);
            setLoadingStops(false);
        }
    };

    const filteredStops = useMemo(() => {
        return stopsWithDistance.filter(item => item.distanceKm <= radiusKm);
    }, [stopsWithDistance, radiusKm]);

    const openInMaps = (stop: Stop) => {
        const coordsArray = (stop.geometry?.coordinates || stop.location?.coordinates) as number[] | undefined;
        if (!coordsArray || coordsArray.length < 2) return;
        const [lon, lat] = coordsArray;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
        Linking.openURL(url);
    };

    const renderStopItem = ({ item }: { item: StopDistance }) => (
        <View style={styles.stopCard}>
            <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{item.stop.name}</Text>
                <Text style={styles.stopDistance}>{formatKm(item.distanceKm)} km away</Text>
            </View>
            <Pressable
                style={({ pressed }) => [
                    styles.mapsButton,
                    pressed && styles.mapsButtonPressed
                ]}
                onPress={() => openInMaps(item.stop)}
            >
                <Ionicons name="map" size={18} color="#1F2937" />
                <Text style={styles.mapsButtonText}>Maps</Text>
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.floatingShape, styles.shape1]} />
            <View style={[styles.floatingShape, styles.shape2]} />

            <SafeAreaView edges={['top'] as Edge[]} style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
                        <View style={styles.headerTop}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.backButton,
                                    pressed && styles.backButtonPressed
                                ]}
                                onPress={() => router.back()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#1F2937" />
                            </Pressable>
                            <Text style={[styles.title, { fontSize: titleSize }]}>Nearest Stops</Text>
                        </View>
                        <Text style={styles.subtitle}>Find stops around you</Text>
                    </View>

                    <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
                        {!hasPermission && (
                            <View style={styles.permissionCard}>
                                <Ionicons name="location" size={36} color="#1F2937" />
                                <Text style={styles.permissionTitle}>Location required</Text>
                                <Text style={styles.permissionText}>
                                    Enable location access to see nearby bus stops.
                                </Text>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.permissionButton,
                                        pressed && styles.permissionButtonPressed
                                    ]}
                                    onPress={requestPermission}
                                >
                                    <Text style={styles.permissionButtonText}>Enable Location</Text>
                                </Pressable>
                            </View>
                        )}

                        {hasPermission && (
                            <>
                                <View style={styles.sliderCard}>
                                    <View style={styles.sliderHeader}>
                                        <Text style={styles.sliderTitle}>Search Radius</Text>
                                        <Text style={styles.sliderValue}>{formatKm(radiusKm)} km</Text>
                                    </View>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={MIN_KM}
                                        maximumValue={MAX_KM}
                                        step={STEP_KM}
                                        value={radiusKm}
                                        minimumTrackTintColor="#F43F5E"
                                        maximumTrackTintColor="#E5E7EB"
                                        thumbTintColor="#2D3748"
                                        onValueChange={setRadiusKm}
                                    />
                                    <View style={styles.sliderLabels}>
                                        <Text style={styles.sliderLabel}>{MIN_KM} km</Text>
                                        <Text style={styles.sliderLabel}>{MAX_KM} km</Text>
                                    </View>
                                </View>

                                {loading && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#1F2937" />
                                        <Text style={styles.loadingText}>Fetching location...</Text>
                                    </View>
                                )}

                                {error && (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={48} color="#EF4444" />
                                        <Text style={styles.errorText}>{error}</Text>
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.retryButton,
                                                pressed && styles.retryButtonPressed
                                            ]}
                                            onPress={loadLocationAndStops}
                                        >
                                            <Text style={styles.retryButtonText}>Retry</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {!loading && !error && (
                                    <>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryText}>
                                                {filteredStops.length} stops within {formatKm(radiusKm)} km
                                            </Text>
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.refreshButton,
                                                    pressed && styles.refreshButtonPressed
                                                ]}
                                                onPress={loadLocationAndStops}
                                            >
                                                <Ionicons name="refresh" size={16} color="#1F2937" />
                                                <Text style={styles.refreshText}>Refresh</Text>
                                            </Pressable>
                                        </View>

                                        {loadingStops && (
                                            <View style={styles.loadingContainer}>
                                                <ActivityIndicator size="large" color="#1F2937" />
                                                <Text style={styles.loadingText}>Loading stops...</Text>
                                            </View>
                                        )}

                                        {!loadingStops && filteredStops.length === 0 && (
                                            <View style={styles.emptyContainer}>
                                                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                                                <Text style={styles.emptyText}>No stops found</Text>
                                                <Text style={styles.emptySubtext}>Try increasing the search radius</Text>
                                            </View>
                                        )}

                                        {filteredStops.length > 0 && (
                                            <FlatList
                                                data={filteredStops}
                                                keyExtractor={(item) => item.stop.id || item.stop._id}
                                                renderItem={renderStopItem}
                                                showsVerticalScrollIndicator={false}
                                                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </View>
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
    },
    floatingShape: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.04,
    },
    shape1: {
        width: 200,
        height: 200,
        backgroundColor: '#60a5fa',
        top: '10%',
        right: -80,
    },
    shape2: {
        width: 160,
        height: 160,
        backgroundColor: '#f472b6',
        bottom: '30%',
        left: -60,
    },
    header: {
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FAF8F5',
        borderWidth: 2,
        borderColor: '#2D3748',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonPressed: {
        backgroundColor: '#E5E7EB',
    },
    title: {
        color: '#1F2937',
        fontFamily: 'Poppins_700Bold',
        letterSpacing: -0.8,
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Poppins_400Regular',
        marginLeft: 52,
    },
    body: {
        flex: 1,
    },
    sliderCard: {
        backgroundColor: '#FAF8F5',
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        padding: 16,
        marginBottom: 16,
    },
    sliderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sliderTitle: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
    },
    sliderValue: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
    },
    slider: {
        width: '100%',
        height: 36,
    },
    sliderLabels: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sliderLabel: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#6B7280',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 13,
        fontFamily: 'Poppins_500Medium',
        color: '#1F2937',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#2D3748',
        backgroundColor: '#FAF8F5',
    },
    refreshButtonPressed: {
        backgroundColor: '#E5E7EB',
    },
    refreshText: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
    },
    stopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FAF8F5',
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    stopInfo: {
        flex: 1,
    },
    stopName: {
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
        marginBottom: 4,
    },
    stopDistance: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#6B7280',
    },
    mapsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#2D3748',
        backgroundColor: '#A8E5BC',
    },
    mapsButtonPressed: {
        backgroundColor: '#86d39e',
    },
    mapsButtonText: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        color: '#6B7280',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        color: '#EF4444',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2D3748',
        backgroundColor: '#FAF8F5',
    },
    retryButtonPressed: {
        backgroundColor: '#E5E7EB',
    },
    retryButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: '#6B7280',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    permissionCard: {
        backgroundColor: '#FAF8F5',
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        padding: 20,
        alignItems: 'center',
        gap: 10,
    },
    permissionTitle: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
    },
    permissionText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#6B7280',
        textAlign: 'center',
    },
    permissionButton: {
        marginTop: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2D3748',
        backgroundColor: '#A8E5BC',
    },
    permissionButtonPressed: {
        backgroundColor: '#86d39e',
    },
    permissionButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
    },
});
