import axios from 'axios';
import type { Stop, Route } from '../types/database';

// Base URL for the Open BMTC API
const API_BASE_URL = 'https://open-bmtc-api.vercel.app/api';

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
        // Try to get stops by searching for routes that might contain this stop
        const response = await axios.get(`${API_BASE_URL}/bmtc/aggregated`, {
            params: { routeId: query }
        });

        const features = response.data.features || [];

        // Filter stops that match the query
        const filteredFeatures = features.filter((feature: any) =>
            feature.properties.name.toLowerCase().includes(query.toLowerCase())
        );

        // Convert features to Stop objects
        const stops: Stop[] = filteredFeatures.slice(0, limit).map((feature: any) => ({
            _id: feature.properties.name,
            name: feature.properties.name,
            trip_count: 0,
            trip_list: [],
            route_count: feature.properties.route_count || 0,
            route_list: feature.properties.route_list || [],
            id: feature.properties.name,
            geometry: feature.geometry,
            location: feature.geometry
        }));

        return {
            stops,
            total: stops.length
        };
    } catch (error: any) {
        if (error.response?.status === 404) {
            return { stops: [], total: 0 };
        }
        console.error('Error searching stops:', error);
        throw error;
    }
}

/**
 * Get route details by route ID
 */
export async function getRouteDetailsAPI(routeId: string) {
    try {
        const response = await axios.get(`${API_BASE_URL}/bmtc/aggregated`, {
            params: { routeId }
        });

        return response.data;
    } catch (error) {
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
