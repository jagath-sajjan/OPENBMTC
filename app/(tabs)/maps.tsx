import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useState, useRef } from 'react';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';

export default function MapsScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const isSmallPhone = width < 375;
    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;

    const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : isSmallPhone ? 16 : 20;
    const titleSize = isTablet ? 44 : isSmallPhone ? 32 : 38;

    // Bengaluru coordinates
    const bengaluruRegion = {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
    };

    const [region, setRegion] = useState(bengaluruRegion);

    const handleZoomIn = () => {
        const newRegion = {
            ...region,
            latitudeDelta: region.latitudeDelta / 1.5,
            longitudeDelta: region.longitudeDelta / 1.5,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 300);
    };

    const handleZoomOut = () => {
        const newRegion = {
            ...region,
            latitudeDelta: region.latitudeDelta * 1.5,
            longitudeDelta: region.longitudeDelta * 1.5,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 300);
    };

    const handleMyLocation = () => {
        mapRef.current?.animateToRegion(bengaluruRegion, 500);
        setRegion(bengaluruRegion);
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
                                <Text style={styles.locationText}>Bengaluru</Text>
                            </View>
                            <Text style={styles.coordsText}>12.9716° N, 77.5946° E</Text>
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
                                showsMyLocationButton={false}
                                showsCompass={true}
                                showsScale={true}
                                loadingEnabled={true}
                                loadingIndicatorColor="#1F2937"
                            />

                            {/* Zoom Controls */}
                            <View style={styles.zoomControls}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.zoomButton,
                                        pressed && styles.zoomButtonPressed
                                    ]}
                                    onPress={handleZoomIn}
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
});
