import { View, Text, TextInput, StyleSheet, Pressable, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { searchAll, searchStopsAPI, searchRoutesAPI } from '../utils/api';
import type { Stop, Route } from '../types/database';
import RouteDetailsModal from '../components/RouteDetailsModal';

export default function SearchRoutesScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const rawMode = typeof params.mode === 'string' ? params.mode : Array.isArray(params.mode) ? params.mode[0] : undefined;
    const searchMode = rawMode === 'stops' ? 'stops' : rawMode === 'routes' ? 'routes' : 'all';

    const [searchQuery, setSearchQuery] = useState('');
    const [stops, setStops] = useState<Stop[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const isSmallPhone = width < 375;
    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;

    const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : isSmallPhone ? 16 : 20;
    const titleSize = isTablet ? 44 : isSmallPhone ? 32 : 38;

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                handleSearch();
            } else {
                setStops([]);
                setRoutes([]);
                setError(null);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchMode]);

    const handleSearch = async () => {
        if (searchQuery.length < 2) return;

        setLoading(true);
        setError(null);

        try {
            if (searchMode === 'stops') {
                const result = await searchStopsAPI(searchQuery, 10);
                setStops(result.stops);
                setRoutes([]);
            } else if (searchMode === 'routes') {
                const result = await searchRoutesAPI(searchQuery, 10);
                setRoutes(result.routes);
                setStops([]);
            } else {
                const result = await searchAll(searchQuery, 10);
                setStops(result.stops);
                setRoutes(result.routes);
            }
        } catch (err) {
            setError('Failed to search. Please try again.');
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderStopItem = ({ item }: { item: Stop }) => (
        <Pressable
            style={({ pressed }) => [
                styles.resultCard,
                pressed && styles.resultCardPressed
            ]}
            onPress={() => {
                router.push({ pathname: '/stop-details', params: { id: item.id || item._id, name: item.name } });
            }}
        >
            <View style={[styles.resultIcon, { backgroundColor: '#A8E5BC' }]}>
                <Ionicons name="location" size={20} color="#1F2937" />
            </View>
            <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.name}</Text>
                <Text style={styles.resultSubtitle}>
                    {item.route_count} route{item.route_count !== 1 ? 's' : ''} • {item.trip_count} trips
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
    );

    const renderRouteItem = ({ item }: { item: Route }) => (
        <Pressable
            style={({ pressed }) => [
                styles.resultCard,
                pressed && styles.resultCardPressed
            ]}
            onPress={() => {
                setSelectedRouteId(item.name);
                setModalVisible(true);
            }}
        >
            <View style={[styles.resultIcon, { backgroundColor: '#FFA776' }]}>
                <Ionicons name="bus" size={20} color="#1F2937" />
            </View>
            <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.name}</Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {item.full_name}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
    );

    const renderSectionHeader = (title: string, count: number) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionCount}>{count}</Text>
        </View>
    );

    const showRoutes = searchMode !== 'stops';
    const showStops = searchMode !== 'routes';
    const headerTitle = searchMode === 'stops' ? 'Search Stops' : searchMode === 'routes' ? 'Search Routes' : 'Search';
    const headerSubtitle = searchMode === 'stops'
        ? 'Find bus stops'
        : searchMode === 'routes'
            ? 'Find bus routes'
            : 'Find routes and stops';
    const inputPlaceholder = searchMode === 'stops'
        ? 'Search for stops...'
        : searchMode === 'routes'
            ? 'Search for routes...'
            : 'Search for routes or stops...';
    const emptyTitle = searchMode === 'stops'
        ? 'No stops found'
        : searchMode === 'routes'
            ? 'No routes found'
            : 'No results found';
    const emptySubtitle = searchMode === 'stops'
        ? 'Try searching for a stop name'
        : searchMode === 'routes'
            ? 'Try searching for a route number'
            : 'Try searching for a route number or stop name';
    const isEmpty = (showRoutes ? routes.length === 0 : true) && (showStops ? stops.length === 0 : true);

    return (
        <View style={styles.container}>
            {/* Decorative shapes */}
            <View style={[styles.floatingShape, styles.shape1]} />
            <View style={[styles.floatingShape, styles.shape2]} />

            <SafeAreaView edges={['top'] as Edge[]} style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Header */}
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
                            <Text style={[styles.title, { fontSize: titleSize }]}>{headerTitle}</Text>
                        </View>
                        <Text style={styles.subtitle}>{headerSubtitle}</Text>
                    </View>

                    {/* Search Input */}
                    <View style={[styles.searchContainer, { marginHorizontal: horizontalPadding }]}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={inputPlaceholder}
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <Pressable
                                    onPress={() => setSearchQuery('')}
                                    style={styles.clearButton}
                                >
                                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* Results */}
                    <View style={[styles.resultsContainer, { paddingHorizontal: horizontalPadding }]}>
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#1F2937" />
                                <Text style={styles.loadingText}>Searching...</Text>
                            </View>
                        )}

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {!loading && !error && searchQuery.length >= 2 && (
                            <FlatList
                                data={[]}
                                renderItem={() => null}
                                ListHeaderComponent={
                                    <>
                                        {/* Routes Section */}
                                        {showRoutes && routes.length > 0 && (
                                            <>
                                                {renderSectionHeader('Routes', routes.length)}
                                                {routes.map((route) => (
                                                    <View key={route._id}>
                                                        {renderRouteItem({ item: route })}
                                                    </View>
                                                ))}
                                            </>
                                        )}

                                        {/* Stops Section */}
                                        {showStops && stops.length > 0 && (
                                            <>
                                                {renderSectionHeader('Stops', stops.length)}
                                                {stops.map((stop) => (
                                                    <View key={stop._id}>
                                                        {renderStopItem({ item: stop })}
                                                    </View>
                                                ))}
                                            </>
                                        )}

                                        {/* No Results */}
                                        {isEmpty && (
                                            <View style={styles.emptyContainer}>
                                                <Ionicons name="search" size={64} color="#D1D5DB" />
                                                <Text style={styles.emptyText}>{emptyTitle}</Text>
                                                <Text style={styles.emptySubtext}>{emptySubtitle}</Text>
                                            </View>
                                        )}
                                    </>
                                }
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                            />
                        )}

                        {!loading && !error && searchQuery.length < 2 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyText}>Start searching</Text>
                                <Text style={styles.emptySubtext}>
                                    Enter at least 2 characters to search
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>

            {/* Route Details Modal */}
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
    searchContainer: {
        marginBottom: 20,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAF8F5',
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        paddingHorizontal: 16,
        height: 56,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'Poppins_400Regular',
    },
    clearButton: {
        padding: 4,
    },
    resultsContainer: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
    },
    sectionCount: {
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
        color: '#6B7280',
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAF8F5',
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: '#2D3748',
        padding: 16,
        marginBottom: 12,
    },
    resultCardPressed: {
        backgroundColor: '#E5E7EB',
    },
    resultIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2D3748',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    resultContent: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: '#1F2937',
        marginBottom: 2,
    },
    resultSubtitle: {
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        color: '#6B7280',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        color: '#EF4444',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
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
        paddingHorizontal: 40,
    },
});
