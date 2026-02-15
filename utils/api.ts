import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Stop, Route } from '../types/database';

// Base URL for the Open BMTC API
const API_BASE_URL = 'https://open-bmtc-api.vercel.app/api';
const ALL_STOPS_CACHE_KEY = 'all_stops_cache_v1';
const ROUTE_ENDPOINTS_CACHE_KEY = 'route_endpoints_cache_v1';
const STOPS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ROUTE_ENDPOINTS_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeQuery = (query: string) => query.trim().toLowerCase();

type AllStopsCache = {
    updatedAt: number;
    stops: Stop[];
};

export type RouteEndpoints = {
    routeId: string;
    from: string;
    to: string;
    isCircular: boolean;
    stopCount: number;
};

type RouteEndpointsCache = {
    updatedAt: number;
    byRoute: Record<string, RouteEndpoints>;
};

let inMemoryStopsCache: AllStopsCache | null = null;
let inMemoryRouteEndpoints: RouteEndpointsCache | null = null;

const loadAllStopsCache = async (): Promise<AllStopsCache | null> => {
    try {
        if (inMemoryStopsCache && Date.now() - inMemoryStopsCache.updatedAt <= STOPS_CACHE_TTL_MS) {
            return inMemoryStopsCache;
        }

        const raw = await AsyncStorage.getItem(ALL_STOPS_CACHE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as AllStopsCache;
        if (!parsed || typeof parsed.updatedAt !== 'number' || !Array.isArray(parsed.stops)) {
            await AsyncStorage.removeItem(ALL_STOPS_CACHE_KEY);
            return null;
        }

        const isExpired = Date.now() - parsed.updatedAt > STOPS_CACHE_TTL_MS;
        if (isExpired) {
            await AsyncStorage.removeItem(ALL_STOPS_CACHE_KEY);
            return null;
        }

        inMemoryStopsCache = parsed;
        return parsed;
    } catch (error) {
        console.error('Error reading stops cache:', error);
        return null;
    }
};

const saveAllStopsCache = async (cache: AllStopsCache) => {
    try {
        inMemoryStopsCache = cache;
        await AsyncStorage.setItem(ALL_STOPS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving stops cache:', error);
    }
};

const loadRouteEndpointsCache = async (): Promise<RouteEndpointsCache | null> => {
    try {
        if (inMemoryRouteEndpoints && Date.now() - inMemoryRouteEndpoints.updatedAt <= ROUTE_ENDPOINTS_TTL_MS) {
            return inMemoryRouteEndpoints;
        }

        const raw = await AsyncStorage.getItem(ROUTE_ENDPOINTS_CACHE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as RouteEndpointsCache;
        if (!parsed || typeof parsed.updatedAt !== 'number' || !parsed.byRoute) {
            await AsyncStorage.removeItem(ROUTE_ENDPOINTS_CACHE_KEY);
            return null;
        }

        const isExpired = Date.now() - parsed.updatedAt > ROUTE_ENDPOINTS_TTL_MS;
        if (isExpired) {
            await AsyncStorage.removeItem(ROUTE_ENDPOINTS_CACHE_KEY);
            return null;
        }

        inMemoryRouteEndpoints = parsed;
        return parsed;
    } catch (error) {
        console.error('Error reading route endpoints cache:', error);
        return null;
    }
};

const saveRouteEndpointsCache = async (cache: RouteEndpointsCache) => {
    try {
        inMemoryRouteEndpoints = cache;
        await AsyncStorage.setItem(ROUTE_ENDPOINTS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving route endpoints cache:', error);
    }
};

const mapFeatureToStop = (feature: any): Stop => ({
    _id: feature.properties?.id || feature.properties?.name || feature.id || '',
    id: feature.properties?.id || feature.properties?.name || feature.id || '',
    name: feature.properties?.name || 'Unknown Stop',
    trip_count: feature.properties?.trip_count || 0,
    trip_list: feature.properties?.trip_list || [],
    route_count: feature.properties?.route_count || 0,
    route_list: feature.properties?.route_list || [],
    geometry: feature.geometry,
    location: feature.geometry
});

const fetchAllStops = async (): Promise<Stop[]> => {
    const response = await axios.get(`${API_BASE_URL}/bmtc/stops`, {
        timeout: 15000
    });

    const features = response.data?.features || [];
    if (!Array.isArray(features)) return [];

    return features.map(mapFeatureToStop).filter((stop: Stop) => stop.name);
};

const getAllStopsCached = async (): Promise<Stop[]> => {
    const cached = await loadAllStopsCache();
    if (cached) return cached.stops;

    const stops = await fetchAllStops();
    await saveAllStopsCache({ updatedAt: Date.now(), stops });
    return stops;
};

const buildFallbackRouteStops = async (routeId: string): Promise<any[]> => {
    const normalizedRouteId = routeId.trim();
    const allStops = await getAllStopsCached();
    const matches = allStops.filter(stop => (stop.route_list || []).includes(normalizedRouteId));

    if (matches.length === 0) return [];

    matches.sort((a, b) => a.name.localeCompare(b.name));

    return matches.map((stop, index) => ({
        type: 'Feature',
        geometry: stop.geometry || stop.location || null,
        properties: {
            name: stop.name,
            stop_sequence: index + 1
        }
    }));
};

export async function getStopByName(stopName: string): Promise<Stop | null> {
    const normalized = normalizeQuery(stopName);
    const stops = await getAllStopsCached();
    const exact = stops.find(stop => normalizeQuery(stop.name) === normalized);
    return exact || null;
}

export async function getStopById(stopId: string): Promise<Stop | null> {
    const trimmedId = stopId.trim();
    const stops = await getAllStopsCached();
    const exact = stops.find(stop => stop.id === trimmedId || stop._id === trimmedId);
    return exact || null;
}

const extractRouteEndpoints = (routeData: any): Omit<RouteEndpoints, 'routeId'> => {
    const stops = routeData?.features || [];
    if (!Array.isArray(stops) || stops.length === 0) {
        return { from: '', to: '', isCircular: false, stopCount: 0 };
    }

    const stopsByDirection: Record<string, any[]> = {};
    stops.forEach((stop: any) => {
        const dir = stop.properties?.direction_id || stop.properties?.direction || '0';
        if (!stopsByDirection[dir]) {
            stopsByDirection[dir] = [];
        }
        stopsByDirection[dir].push(stop);
    });

    let maxStops = 0;
    let selectedDirection = Object.keys(stopsByDirection)[0];

    Object.keys(stopsByDirection).forEach(dir => {
        if (stopsByDirection[dir].length > maxStops) {
            maxStops = stopsByDirection[dir].length;
            selectedDirection = dir;
        }
    });

    const targetStops = stopsByDirection[selectedDirection] || stops;
    const sortedStops = [...targetStops].sort((a, b) => {
        const seqA = a.properties?.stop_sequence || 0;
        const seqB = b.properties?.stop_sequence || 0;
        return seqA - seqB;
    });

    const stopCount = sortedStops.length;
    const firstStop = sortedStops[0]?.properties?.name || '';
    const lastStop = sortedStops[stopCount - 1]?.properties?.name || '';
    const isCircular = firstStop !== '' && firstStop === lastStop;

    return { from: firstStop, to: lastStop, isCircular, stopCount };
};

export async function getRouteEndpoints(routeId: string): Promise<RouteEndpoints> {
    const trimmedRouteId = routeId.trim();
    const cached = await loadRouteEndpointsCache();
    const cachedEntry = cached?.byRoute?.[trimmedRouteId];
    if (cachedEntry) return cachedEntry;

    const routeData = await getRouteDetailsAPI(trimmedRouteId);
    const endpoints = extractRouteEndpoints(routeData);
    const result: RouteEndpoints = { routeId: trimmedRouteId, ...endpoints };

    const nextCache: RouteEndpointsCache = {
        updatedAt: Date.now(),
        byRoute: {
            ...(cached?.byRoute || {}),
            [trimmedRouteId]: result
        }
    };
    await saveRouteEndpointsCache(nextCache);

    return result;
}

/**
 * Search for bus routes by route ID
 * The API accepts flexible formats like 258c, 258-C, 258C
 */
export async function searchRoutesAPI(query: string, limit: number = 10) {
    try {
        // For now, we'll search by trying the query as a routeId
        // The API will handle different formats
        console.log(`API Request: ${API_BASE_URL}/bmtc/aggregated?routeId=${query}`);
        const response = await axios.get(`${API_BASE_URL}/bmtc/aggregated`, {
            params: { routeId: query },
            timeout: 10000 // 10s timeout
        });

        // The API returns stops with route information
        // We need to extract unique routes from the response
        const stops = response.data.features || [];
        const routeSet = new Set<string>();

        stops.forEach((stop: any) => {
            if (stop.properties && stop.properties.route_list) {
                stop.properties.route_list.forEach((route: string) => {
                    // Filter routes that match the query
                    if (route.toLowerCase().includes(query.toLowerCase())) {
                        routeSet.add(route);
                    }
                });
            }
        });

        // Convert to route objects
        const routes = Array.from(routeSet).slice(0, limit).map(routeName => ({
            _id: routeName,
            name: routeName,
            full_name: `Route ${routeName}`,
            trip_count: 0,
            trip_list: [],
            stop_count: 0,
            stop_list: [],
            id: routeName,
            direction_id: 0
        }));

        return {
            routes,
            total: routes.length
        };
    } catch (error: any) {
        // If the route doesn't exist, return empty
        if (error.response?.status === 404) {
            return { routes: [], total: 0 };
        }
        console.error('Error searching routes:', error);
        throw error;
    }
}

/**
 * Search for bus stops
 * Currently uses the aggregated endpoint to get stops for a route
 */
export async function searchStopsAPI(query: string, limit: number = 10) {
    try {
        const normalizedQuery = normalizeQuery(query);
        const allStops = await getAllStopsCached();

        const matches = allStops.filter(stop =>
            stop.name.toLowerCase().includes(normalizedQuery)
        );

        matches.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aIndex = aName.indexOf(normalizedQuery);
            const bIndex = bName.indexOf(normalizedQuery);

            if (aIndex !== bIndex) return aIndex - bIndex;
            if (aName.length !== bName.length) return aName.length - bName.length;
            return aName.localeCompare(bName);
        });

        return {
            stops: matches.slice(0, limit),
            total: matches.length
        };
    } catch (error: any) {
        console.error('Error searching stops:', error);
        return { stops: [], total: 0 };
    }
}

/**
 * Get route details by route ID
 */
export async function getRouteDetailsAPI(routeId: string) {
    const normalizedRouteId = routeId.trim();
    try {
        const response = await axios.get(`${API_BASE_URL}/bmtc/aggregated`, {
            params: { routeId: normalizedRouteId }
        });

        const features = response.data?.features || [];
        if (Array.isArray(features) && features.length > 0) {
            return response.data;
        }

        const fallbackFeatures = await buildFallbackRouteStops(normalizedRouteId);
        if (fallbackFeatures.length > 0) {
            return {
                type: 'FeatureCollection',
                features: fallbackFeatures,
                meta: {
                    routeId: normalizedRouteId,
                    fallback: true,
                    count: fallbackFeatures.length
                }
            };
        }

        throw new Error('Route details not found');
    } catch (error) {
        try {
            const fallbackFeatures = await buildFallbackRouteStops(normalizedRouteId);
            if (fallbackFeatures.length > 0) {
                return {
                    type: 'FeatureCollection',
                    features: fallbackFeatures,
                    meta: {
                        routeId: normalizedRouteId,
                        fallback: true,
                        count: fallbackFeatures.length
                    }
                };
            }
        } catch (fallbackError) {
            console.error('Error building fallback route details:', fallbackError);
        }

        console.error('Error getting route details:', error);
        throw error;
    }
}

/**
 * Find routes between two stops (not directly supported by current API)
 */
export async function findRoutesBetweenStopsAPI(from: string, to: string) {
    // This would require a different endpoint or client-side logic
    console.warn('findRoutesBetweenStopsAPI not yet implemented with current API');
    return { routes: [], total: 0, from, to };
}

/**
 * Get nearby stops (not directly supported by current API without bbox)
 */
export async function getNearbyStopsAPI(
    latitude: number,
    longitude: number,
    maxDistance: number = 1000,
    limit: number = 10
) {
    // This would require bbox calculation or a different endpoint
    console.warn('getNearbyStopsAPI not yet implemented with current API');
    return { stops: [], total: 0, location: { latitude, longitude }, maxDistance };
}

/**
 * Combined search for both stops and routes
 * This will search for routes matching the query
 */
export async function searchAll(query: string, limit: number = 5) {
    try {
        // Search for routes
        const routesResult = await searchRoutesAPI(query, limit);

        // Search for stops (using the same query)
        const stopsResult = await searchStopsAPI(query, limit);

        return {
            stops: stopsResult.stops || [],
            routes: routesResult.routes || [],
            totalStops: stopsResult.total || 0,
            totalRoutes: routesResult.total || 0
        };
    } catch (error) {
        console.error('Error in combined search:', error);
        // Return empty results instead of throwing
        return {
            stops: [],
            routes: [],
            totalStops: 0,
            totalRoutes: 0
        };
    }
}

/**
 * Get API health status
 */
export async function getAPIHealth() {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        return response.data;
    } catch (error) {
        console.error('Error checking API health:', error);
        throw error;
    }
}

/**
 * Get API metadata
 */
export async function getAPIMeta() {
    try {
        const response = await axios.get(`${API_BASE_URL}/meta`);
        return response.data;
    } catch (error) {
        console.error('Error getting API meta:', error);
        throw error;
    }
}
