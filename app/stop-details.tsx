import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Stop } from '../types/database';
import { getStopById, getStopByName, getRouteEndpoints, RouteEndpoints } from '../utils/api';
import RouteDetailsModal from '../components/RouteDetailsModal';

type RouteSummary = RouteEndpoints & { error?: boolean };

export default function StopDetailsScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const rawId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
    const rawName = typeof params.name === 'string' ? params.name : Array.isArray(params.name) ? params.name[0] : '';
    const stopId = useMemo(() => rawId?.trim() || '', [rawId]);
    const stopName = useMemo(() => rawName?.trim() || '', [rawName]);

    const [stop, setStop] = useState<Stop | null>(null);
    const [routeIds, setRouteIds] = useState<string[]>([]);
    const [routeSummaries, setRouteSummaries] = useState<Record<string, RouteSummary>>({});
    const [loadingStop, setLoadingStop] = useState(false);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const isSmallPhone = width < 375;
    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;

    const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : isSmallPhone ? 16 : 20;
    const titleSize = isTablet ? 40 : isSmallPhone ? 30 : 36;

    useEffect(() => {
        if (!stopId && !stopName) {
            setError('Stop not found');
            setStop(null);
            return;
        }

        const loadStop = async () => {
            setLoadingStop(true);
            setError(null);
            try {
                const found = stopId ? await getStopById(stopId) : await getStopByName(stopName);
                if (!found) {
                    setError('Stop not found');
                    setStop(null);
                    return;
                }
                setStop(found);
            } catch (err) {
                console.error('Error loading stop details:', err);
                setError('Failed to load stop details');
                setStop(null);
            } finally {
                setLoadingStop(false);
            }
        };

        loadStop();
    }, [stopId, stopName]);

    useEffect(() => {
        if (!stop) return;

        let cancelled = false;
        const uniqueRoutes = Array.from(new Set((stop.route_list || []).filter(Boolean)));

        setRouteIds(uniqueRoutes);
        setRouteSummaries({});
        setLoadingRoutes(true);

        const loadRoutes = async () => {
            const batchSize = 6;
            for (let i = 0; i < uniqueRoutes.length; i += batchSize) {
                const batch = uniqueRoutes.slice(i, i + batchSize);
                const results = await Promise.all(
                    batch.map(async routeId => {
                        try {
                            return await getRouteEndpoints(routeId);
                        } catch (err) {
                            console.error(`Error loading route ${routeId}:`, err);
                            return { routeId, from: '', to: '', isCircular: false, stopCount: 0, error: true };
                        }
                    })
                );

                if (cancelled) return;

                setRouteSummaries(prev => {
                    const next = { ...prev };
                    results.forEach(result => {
                        next[result.routeId] = result;
                    });
                    return next;
                });
            }

            if (!cancelled) {
                setLoadingRoutes(false);
            }
        };

        loadRoutes();

        return () => {
            cancelled = true;
        };
    }, [stop?.name]);

    const renderRouteItem = ({ item }: { item: string }) => {
        const summary = routeSummaries[item];
        const isLoading = !summary;
        const hasError = summary?.error;

        return (
            <Pressable
                style={({ pressed }) => [
                    styles.routeCard,
                    pressed && styles.routeCardPressed
                ]}
                onPress={() => {
                    setSelectedRouteId(item);
                    setModalVisible(true);
                }}
            >
                <View style={styles.routeCardHeader}>
                    <View style={styles.routeBadge}>
                        <Ionicons name="bus" size={14} color="#F8FAFC" />
                        <Text style={styles.routeBadgeText}>{item}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </View>
                {!isLoading && !hasError && summary?.from && summary?.to ? (
                    <View style={styles.endpointList}>
                        <View style={styles.endpointRow}>
                            <View style={[styles.endpointDot, styles.endpointDotStart]} />
                            <Text style={styles.endpointText}>{summary.from}</Text>
                        </View>
                        <View style={styles.endpointConnector}>
                            <View style={styles.endpointLine} />
                            <Ionicons name="chevron-down" size={12} color="#F43F5E" />
                        </View>
                        <View style={styles.endpointRow}>
                            <View style={[styles.endpointDot, styles.endpointDotEnd]} />
                            <Text style={styles.endpointText}>{summary.to}</Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.routeTitle}>
                        {hasError ? 'Route details unavailable' : 'Loading route details...'}
                    </Text>
                )}
                <Text style={styles.routeMeta}>
                    Through: {stop?.name || ''}
                    {summary?.isCircular ? ' • Circular' : ''}
                </Text>
                {summary && !summary.error && summary.stopCount > 0 && (
                    <Text style={styles.routeStops}>{summary.stopCount} stops</Text>
                )}
                {isLoading && (
                    <View style={styles.routeLoading}>
                        <ActivityIndicator size="small" color="#1F2937" />
                    </View>
                )}
            </Pressable>
        );
    };

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
                            <Text style={[styles.title, { fontSize: titleSize }]}>Stop Details</Text>
                        </View>
                        <Text style={styles.subtitle}>Routes passing through this stop</Text>
                    </View>

                    <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
                        {loadingStop && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#1F2937" />
                                <Text style={styles.loadingText}>Loading stop details...</Text>
                            </View>
                        )}

                        {!loadingStop && error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.retryButton,
                                        pressed && styles.retryButtonPressed
                                    ]}
                                    onPress={() => {
                                        if (!stopId && !stopName) return;
                                        setStop(null);
                                        setError(null);
                                        setRouteIds([]);
                                        setRouteSummaries({});
                                        setLoadingRoutes(false);
                                        setLoadingStop(true);
                                        (stopId ? getStopById(stopId) : getStopByName(stopName))
                                            .then(found => setStop(found))
                                            .catch(err => {
                                                console.error('Error loading stop details:', err);
                                                setError('Failed to load stop details');
                                            })
                                            .finally(() => setLoadingStop(false));
                                    }}
                                >
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </Pressable>
                            </View>
                        )}

                        {!loadingStop && !error && stop && (
                            <>
                                <View style={styles.stopCard}>
                                    <View style={styles.stopIcon}>
                                        <Ionicons name="location" size={20} color="#1F2937" />
                                    </View>
                                    <View style={styles.stopCardContent}>
                                        <Text style={styles.stopName}>{stop.name}</Text>
                                        <Text style={styles.stopMeta}>
                                            {routeIds.length} route{routeIds.length !== 1 ? 's' : ''} pass through this stop
                                        </Text>
                                    </View>
                                </View>

                                {loadingRoutes && routeIds.length === 0 && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#1F2937" />
                                        <Text style={styles.loadingText}>Loading routes...</Text>
                                    </View>
                                )}

                                {routeIds.length > 0 && (
                                    <FlatList
                                        data={routeIds}
                                        keyExtractor={(item) => item}
                                        renderItem={renderRouteItem}
                                        showsVerticalScrollIndicator={false}
                                        style={styles.routeList}
                                        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                                    />
                                )}

                                {!loadingRoutes && routeIds.length === 0 && (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="bus-outline" size={56} color="#D1D5DB" />
                                        <Text style={styles.emptyText}>No routes found</Text>
                                        <Text style={styles.emptySubtext}>This stop has no routes listed</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </SafeAreaView>

            {selectedRouteId && (
                <RouteDetailsModal
                    visible={modalVisible}
                    routeId={selectedRouteId}
                    onClose={() => setModalVisible(false)}
                />
            )}
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
    routeList: {
        flex: 1,
    },
    stopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAF8F5',
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        padding: 16,
        marginBottom: 16,
    },
    stopIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2D3748',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#A8E5BC',
    },
    stopCardContent: {
        flex: 1,
    },
    stopName: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
        marginBottom: 4,
    },
    stopMeta: {
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        color: '#6B7280',
    },
    routeCard: {
        backgroundColor: '#FAF8F5',
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        padding: 16,
        marginBottom: 12,
    },
    routeCardPressed: {
        backgroundColor: '#E5E7EB',
    },
    routeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    routeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F43F5E',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    routeBadgeText: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        color: '#F8FAFC',
    },
    routeTitle: {
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
        color: '#1F2937',
        marginBottom: 4,
    },
    endpointList: {
        marginBottom: 6,
        gap: 6,
    },
    endpointRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    endpointDot: {
        width: 8,
        height: 8,
        borderRadius: 6,
    },
    endpointDotStart: {
        backgroundColor: '#F43F5E',
    },
    endpointDotEnd: {
        backgroundColor: '#10B981',
    },
    endpointText: {
        fontSize: 13,
        fontFamily: 'Poppins_500Medium',
        color: '#1F2937',
        flex: 1,
    },
    endpointConnector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 3,
    },
    endpointLine: {
        width: 8,
        height: 14,
        borderLeftWidth: 2,
        borderLeftColor: '#F43F5E',
    },
    routeMeta: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#6B7280',
        marginBottom: 4,
    },
    routeStops: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#9CA3AF',
    },
    routeLoading: {
        marginTop: 8,
        alignItems: 'flex-start',
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
});
