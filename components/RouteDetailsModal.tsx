import { View, Text, StyleSheet, Pressable, Modal, ScrollView, useWindowDimensions, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import { getRouteDetailsAPI } from '../utils/api';

interface RouteDetailsModalProps {
    visible: boolean;
    routeId: string;
    onClose: () => void;
}

export default function RouteDetailsModal({ visible, routeId, onClose }: RouteDetailsModalProps) {
    const { width } = useWindowDimensions();
    const [routeData, setRouteData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const isSmallPhone = width < 375;
    const isTablet = width >= 768;

    useEffect(() => {
        if (visible && routeId) {
            loadRouteDetails();
        }
    }, [visible, routeId]);

    const loadRouteDetails = async () => {
        setLoading(true);
        setRouteData(null);
        try {
            const data = await getRouteDetailsAPI(routeId);
            setRouteData(data);
        } catch (error) {
            console.error('Error loading route details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    const stops = routeData?.features || [];
    const isFallback = routeData?.meta?.fallback;

    // Group stops by direction to avoid zigzag (mixing UP and DOWN routes)
    const stopsByDirection: Record<string, any[]> = {};
    stops.forEach((stop: any) => {
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

    const targetStops = stopsByDirection[selectedDirection] || stops;

    // Sort stops by sequence
    const sortedStops = [...targetStops].sort((a, b) => {
        const seqA = a.properties?.stop_sequence || 0;
        const seqB = b.properties?.stop_sequence || 0;
        return seqA - seqB;
    });

    const stopCount = sortedStops.length;
    const firstStop = sortedStops[0]?.properties?.name || '';
    const lastStop = sortedStops[stopCount - 1]?.properties?.name || '';

    // Check if it's a circular route (first and last stop are the same or very close)
    const isCircular = firstStop === lastStop ||
        (sortedStops.length > 2 && sortedStops[0]?.properties?.name === sortedStops[stopCount - 1]?.properties?.name);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} style={styles.blurView}>
                <View style={styles.modalContainer}>
                    <View style={styles.modal}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.routeBadge}>
                                <Text style={styles.routeBadgeText}>{routeId}</Text>
                            </View>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.closeButton,
                                    pressed && styles.closeButtonPressed
                                ]}
                                onPress={onClose}
                            >
                                <Ionicons name="close" size={24} color="#1F2937" />
                            </Pressable>
                        </View>

                        {/* Loading State */}
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#1F2937" />
                                <Text style={styles.loadingText}>Loading route details...</Text>
                            </View>
                        )}

                        {/* Content */}
                        {!loading && routeData && stops.length > 0 && (
                            <>
                                {/* Route Title */}
                                <View style={styles.titleContainer}>
                                    <Text style={styles.routeTitle}>
                                        {firstStop} {isCircular ? '↻' : '⇄'} {lastStop}
                                    </Text>
                                    {isFallback && (
                                        <View style={styles.fallbackNotice}>
                                            <Ionicons name="information-circle" size={14} color="#F59E0B" />
                                            <Text style={styles.fallbackText}>Stop order may be approximate</Text>
                                        </View>
                                    )}
                                    <View style={styles.statsContainer}>
                                        <View style={styles.stat}>
                                            <Ionicons name="location" size={14} color="#6B7280" />
                                            <Text style={styles.statText}>{stopCount} STOPS</Text>
                                        </View>
                                        {isCircular && (
                                            <>
                                                <View style={styles.statDivider} />
                                                <View style={styles.stat}>
                                                    <Ionicons name="sync" size={14} color="#6B7280" />
                                                    <Text style={styles.statText}>CIRCULAR</Text>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </View>

                                {/* Stops List - Scrollable */}
                                <ScrollView
                                    style={styles.stopsContainer}
                                    contentContainerStyle={styles.stopsContent}
                                    showsVerticalScrollIndicator={true}
                                    scrollEnabled={true}
                                >
                                    <View style={styles.routeLine}>
                                        {/* Render stops with connecting lines */}
                                        {sortedStops.map((stop: any, index: number) => {
                                            const isFirst = index === 0;
                                            const isLast = index === stopCount - 1;
                                            const stopName = stop.properties?.name || 'Unknown Stop';

                                            return (
                                                <View key={`${stopName}-${index}`} style={styles.stopItemWrapper}>
                                                    {/* Connecting Line Segment (except for last item) */}
                                                    {!isLast && (
                                                        <View style={styles.lineSegmentContainer}>
                                                            <View style={styles.lineSegment} />
                                                            <View style={styles.directionArrow}>
                                                                <Ionicons name="chevron-down" size={12} color="#F43F5E" />
                                                            </View>
                                                        </View>
                                                    )}

                                                    <View style={styles.stopItem}>
                                                        <View style={styles.stopIconContainer}>
                                                            <View style={[
                                                                styles.stopIcon,
                                                                (isFirst || isLast) && styles.stopIconLarge
                                                            ]}>
                                                                {/* Inner dot for hollow effect */}
                                                                <View style={styles.stopIconInner} />
                                                            </View>
                                                        </View>
                                                        <Text style={[
                                                            styles.stopName,
                                                            (isFirst || isLast) && styles.stopNameBold
                                                        ]}>
                                                            {stopName}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* Error State */}
                        {!loading && (!routeData || stops.length === 0) && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                                <Text style={styles.errorText}>Failed to load route details</Text>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.retryButton,
                                        pressed && styles.retryButtonPressed
                                    ]}
                                    onPress={loadRouteDetails}
                                >
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </BlurView>
        </Modal >
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    blurView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxWidth: 400,
    },
    modal: {
        backgroundColor: '#FAF8F5',
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#2D3748',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
    },
    routeBadge: {
        backgroundColor: '#A8E5BC',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2D3748',
    },
    routeBadgeText: {
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
        color: '#1F2937',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E5E7EB',
        borderWidth: 2,
        borderColor: '#2D3748',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonPressed: {
        backgroundColor: '#D1D5DB',
    },
    titleContainer: {
        padding: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
    },
    routeTitle: {
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
        marginBottom: 8,
        lineHeight: 22,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 11,
        fontFamily: 'Poppins_500Medium',
        color: '#6B7280',
        letterSpacing: 0.5,
    },
    fallbackNotice: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    fallbackText: {
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
        color: '#B45309',
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#D1D5DB',
    },
    stopsContainer: {
        maxHeight: 350,
    },
    stopsContent: {
        padding: 16,
        paddingBottom: 8,
    },
    routeLine: {
        paddingHorizontal: 8,
    },
    stopItemWrapper: {
        position: 'relative',
    },
    lineSegmentContainer: {
        position: 'absolute',
        left: 20,
        top: 20,
        bottom: -4, // Extend slightly to connect to next
        width: 0,
        alignItems: 'center',
        zIndex: 1,
    },
    lineSegment: {
        width: 2,
        flex: 1,
        backgroundColor: '#F43F5E',
    },
    directionArrow: {
        position: 'absolute',
        top: '40%',
        backgroundColor: '#FAF8F5',
        borderRadius: 8,
        padding: 0,
    },
    stopItem: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44, // Ensure enough height for line segment
        marginBottom: 0,
        position: 'relative',
        zIndex: 2,
    },
    stopIconContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopIcon: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#F43F5E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopIconLarge: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    stopIconInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FAF8F5',
    },
    stopName: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#1F2937',
        lineHeight: 20,
        paddingVertical: 12,
    },
    stopNameBold: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: '#000000',
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
        color: '#6B7280',
    },
    errorContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        marginTop: 16,
        marginBottom: 20,
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
        color: '#EF4444',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#1F2937',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2D3748',
    },
    retryButtonPressed: {
        backgroundColor: '#374151',
    },
    retryButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: '#FAF8F5',
    },
});
