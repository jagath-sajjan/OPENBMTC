import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useState, useRef, useEffect, useMemo } from 'react';
import MapView, { PROVIDER_DEFAULT, Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';

export default function MapsScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const params = useLocalSearchParams();
    const routeDataParam = params.routeData as string;

    const isSmallPhone = width < 375;
    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;

    const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : isSmallPhone ? 16 : 20;
    const titleSize = isTablet ? 44 : isSmallPhone ? 32 : 38;

    // Bengaluru coordinates (default)
    const bengaluruRegion = {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
    };

    // Start with Bengaluru overview
    const [region, setRegion] = useState(bengaluruRegion);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [initialLocationSet, setInitialLocationSet] = useState(false);

    // Route Visualization Data
    const routeVisualization = useMemo(() => {
        if (!routeDataParam) return null;
        try {
            const data = JSON.parse(routeDataParam);
            const features = data.features || [];

            // Group stops by direction to avoid zigzag (mixing UP and DOWN routes)
            const stopsByDirection: Record<string, any[]> = {};
            features.forEach((stop: any) => {
                const dir = stop.properties?.direction_id || stop.properties?.direction || '0';
                if (!stopsByDirection[dir]) {
                    stopsByDirection[dir] = [];
                }
                stopsByDirection[dir].push(stop);
            });

            // Find the direction with the most stops
            let maxStops = 0;
            let selectedDirection = Object.keys(stopsByDirection)[0];

            Object.keys(stopsByDirection).forEach(dir => {
                if (stopsByDirection[dir].length > maxStops) {
                    maxStops = stopsByDirection[dir].length;
                    selectedDirection = dir;
                }
            });

            const targetStops = stopsByDirection[selectedDirection] || features;

            // Sort stops
            const sortedStops = [...targetStops].sort((a: any, b: any) => {
                return (a.properties?.stop_sequence || 0) - (b.properties?.stop_sequence || 0);
            });

            // Extract coordinates for Polyline
            const coordinates = sortedStops
                .filter((stop: any) => stop.geometry?.coordinates)
                .map((stop: any) => ({
                    latitude: stop.geometry.coordinates[1],
                    longitude: stop.geometry.coordinates[0],
                }));

            return { stops: sortedStops, coordinates };
        } catch (e) {
            console.error("Failed to parse route data", e);
            return null;
        }
    }, [routeDataParam]);

    // For hold-to-zoom functionality
    const zoomIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Zoom limits (keep within Bengaluru area)
    const MIN_DELTA = 0.005; // Maximum zoom in
    const MAX_DELTA = 0.3;   // Maximum zoom out (Bengaluru bounds)

    useEffect(() => {
        if (routeVisualization?.coordinates?.length && mapRef.current) {
            // Fit map to route
            setTimeout(() => {
                mapRef.current?.fitToCoordinates(routeVisualization.coordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }, 500);
        } else {
            getUserLocation();
        }
    }, [routeVisualization]);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();

            if (status === 'granted') {
                setHasLocationPermission(true);
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const userCoords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };

                setUserLocation(userCoords);

                // Cinematic fly-in animation from Bengaluru overview to user location
                if (!initialLocationSet) {
                    // Start from Bengaluru overview
                    setRegion(bengaluruRegion);

                    // After a brief moment, fly to user location
                    setTimeout(() => {
                        const userRegion = {
                            latitude: userCoords.latitude,
                            longitude: userCoords.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        };
                        mapRef.current?.animateToRegion(userRegion, 2000); // 2 second smooth flight
                    }, 800);

                    setInitialLocationSet(true);
                }
            } else {
                setHasLocationPermission(false);
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const performZoom = (zoomIn: boolean) => {
        const factor = zoomIn ? 1.5 : 0.67;
        let newLatDelta = region.latitudeDelta / factor;
        let newLongDelta = region.longitudeDelta / factor;

        // Apply zoom limits
        if (newLatDelta < MIN_DELTA) newLatDelta = MIN_DELTA;
        if (newLatDelta > MAX_DELTA) newLatDelta = MAX_DELTA;
        if (newLongDelta < MIN_DELTA) newLongDelta = MIN_DELTA;
        if (newLongDelta > MAX_DELTA) newLongDelta = MAX_DELTA;

        const newRegion = {
            ...region,
            latitudeDelta: newLatDelta,
            longitudeDelta: newLongDelta,
        };

        mapRef.current?.animateToRegion(newRegion, 200);
    };

    const handleZoomIn = () => {
        performZoom(true);
    };

    const handleZoomOut = () => {
        performZoom(false);
    };

    const startContinuousZoom = (zoomIn: boolean) => {
        // Clear any existing interval
        if (zoomIntervalRef.current) {
            clearInterval(zoomIntervalRef.current);
        }

        // Perform first zoom immediately
        performZoom(zoomIn);

        // Then continue zooming while held
        zoomIntervalRef.current = setInterval(() => {
            performZoom(zoomIn);
        }, 250);
    };

    const stopContinuousZoom = () => {
        if (zoomIntervalRef.current) {
            clearInterval(zoomIntervalRef.current);
            zoomIntervalRef.current = null;
        }
    };

    const handleMyLocation = async () => {
        if (hasLocationPermission && userLocation) {
            // Center on user's actual location
            const userRegion = {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            };
            mapRef.current?.animateToRegion(userRegion, 500);
        } else {
            // Fall back to Bengaluru center
            mapRef.current?.animateToRegion(bengaluruRegion, 500);
        }
    };

    return (
        <View style={styles.container}>
            {/* Decorative shapes */}
            <View style={[styles.floatingShape, styles.shape1]} />
            <View style={[styles.floatingShape, styles.shape2]} />

            <SafeAreaView edges={['top'] as Edge[]} style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
                        <Text style={[styles.title, { fontSize: titleSize }]}>Maps</Text>
                        <Text style={styles.subtitle}>Explore Bangalore bus routes</Text>
                    </View>

                    {/* Map Card */}
                    <View style={[styles.mapCard, { marginHorizontal: horizontalPadding }]}>
                        {/* Map Header */}
                        <View style={styles.mapHeader}>
                            <View style={styles.locationBadge}>
                                <Ionicons name="location" size={16} color="#1F2937" />
                                <Text style={styles.locationText}>
                                    {hasLocationPermission && userLocation ? 'Your Location' : 'Bengaluru'}
                                </Text>
                            </View>
                            <Text style={styles.coordsText}>
                                {hasLocationPermission && userLocation
                                    ? `${userLocation.latitude.toFixed(4)}° N, ${userLocation.longitude.toFixed(4)}° E`
                                    : '12.9716° N, 77.5946° E'}
                            </Text>
                        </View>

                        {/* Map Container */}
                        <View style={styles.mapContainer}>
                            <MapView
                                ref={mapRef}
                                style={styles.map}
                                provider={PROVIDER_DEFAULT}
                                initialRegion={bengaluruRegion}
                                region={region}
                                onRegionChangeComplete={setRegion}
                                showsUserLocation={true}
                                followsUserLocation={false}
                                showsMyLocationButton={false}
                                showsCompass={true}
                                showsScale={true}
                                loadingEnabled={true}
                                loadingIndicatorColor="#1F2937"
                                userLocationCalloutEnabled={true}
                                userLocationAnnotationTitle="You are here"
                            >
                                {routeVisualization && (
                                    <>
                                        <Polyline
                                            coordinates={routeVisualization.coordinates}
                                            strokeColor="#3B82F6"
                                            strokeWidth={4}
                                        />
                                        {routeVisualization.stops.map((stop: any, index: number) => (
                                            <Marker
                                                key={`stop-${index}`}
                                                coordinate={{
                                                    latitude: stop.geometry.coordinates[1],
                                                    longitude: stop.geometry.coordinates[0],
                                                }}
                                                title={stop.properties?.name}
                                                description={`Stop #${index + 1}`}
                                            >
                                                <View style={styles.markerContainer}>
                                                    <View style={[
                                                        styles.markerDot,
                                                        (index === 0 || index === routeVisualization.stops.length - 1) && styles.markerDotLarge
                                                    ]} />
                                                </View>
                                            </Marker>
                                        ))}
                                    </>
                                )}
                            </MapView>

                            {/* Zoom Controls */}
                            <View style={styles.zoomControls}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.zoomButton,
                                        pressed && styles.zoomButtonPressed
                                    ]}
                                    onPress={handleZoomIn}
                                    onPressIn={() => startContinuousZoom(true)}
                                    onPressOut={stopContinuousZoom}
                                >
                                    <Ionicons name="add" size={24} color="#1F2937" />
                                </Pressable>
                                <View style={styles.zoomDivider} />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.zoomButton,
                                        pressed && styles.zoomButtonPressed
                                    ]}
                                    onPress={handleZoomOut}
                                    onPressIn={() => startContinuousZoom(false)}
                                    onPressOut={stopContinuousZoom}
                                >
                                    <Ionicons name="remove" size={24} color="#1F2937" />
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={[styles.quickActions, {
                        marginHorizontal: horizontalPadding,
                        marginBottom: (Platform.OS === 'ios' ? 90 : 85) + insets.bottom
                    }]}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.actionButton,
                                pressed && styles.actionButtonPressed
                            ]}
                            onPress={handleMyLocation}
                        >
                            <Ionicons name="locate" size={20} color="#1F2937" />
                            <Text style={styles.actionText}>Center Map</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.actionButton,
                                pressed && styles.actionButtonPressed
                            ]}
                        >
                            <Ionicons name="layers" size={20} color="#1F2937" />
                            <Text style={styles.actionText}>Route Layers</Text>
                        </Pressable>
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
        width: 180,
        height: 180,
        backgroundColor: '#60a5fa',
        top: '30%',
        right: -60,
    },
    shape2: {
        width: 140,
        height: 140,
        backgroundColor: '#8b5cf6',
        bottom: '20%',
        left: -50,
    },
    header: {
        paddingTop: 16,
        paddingBottom: 20,
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
    mapCard: {
        flex: 1,
        backgroundColor: '#FAF8F5',
        borderWidth: 2.5,
        borderColor: '#2D3748',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#2D3748',
        backgroundColor: '#FAF8F5',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#A8E5BC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2D3748',
    },
    locationText: {
        fontSize: 13,
        color: '#1F2937',
        fontFamily: 'Poppins_600SemiBold',
    },
    coordsText: {
        fontSize: 11,
        color: '#6B7280',
        fontFamily: 'Poppins_500Medium',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    zoomControls: {
        position: 'absolute',
        right: 16,
        top: 16,
        backgroundColor: '#FAF8F5',
        borderRadius: 12,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    zoomButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAF8F5',
    },
    zoomButtonPressed: {
        backgroundColor: '#E5E7EB',
    },
    zoomDivider: {
        height: 2,
        backgroundColor: '#2D3748',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FAF8F5',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    actionButtonPressed: {
        backgroundColor: '#E5E7EB',
    },
    actionText: {
        fontSize: 13,
        color: '#1F2937',
        fontFamily: 'Poppins_600SemiBold',
    },
    markerContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FAF8F5',
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    markerDotLarge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 3,
        backgroundColor: '#A8E5BC',
        borderColor: '#059669',
    },
});
