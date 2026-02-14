import { getStopsCollection, getRoutesCollection } from '../lib/mongodb';
import type { Stop, Route, SearchStopsResponse, SearchRoutesResponse } from '../types/database';

/**
 * Search for stops by name
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of matching stops
 */
export async function searchStops(query: string, limit: number = 10): Promise<SearchStopsResponse> {
    try {
        const stopsCollection = await getStopsCollection();

        // Filter out test data (routes containing "Test" or "test")
        const stops = await stopsCollection
            .find({
                name: { $regex: query, $options: 'i' },
                route_list: { $not: { $regex: /test/i } }
            })
            .limit(limit)
            .toArray() as unknown as Stop[];

        return {
            stops,
            total: stops.length
        };
    } catch (error) {
        console.error('Error searching stops:', error);
        throw new Error('Failed to search stops');
    }
}

/**
 * Search for routes by name or full_name
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of matching routes
 */
export async function searchRoutes(query: string, limit: number = 10): Promise<SearchRoutesResponse> {
    try {
        const routesCollection = await getRoutesCollection();

        // Filter out test data
        const routes = await routesCollection
            .find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { full_name: { $regex: query, $options: 'i' } }
                ],
                name: { $not: { $regex: /test/i } }
            })
            .limit(limit)
            .toArray() as unknown as Route[];

        return {
            routes,
            total: routes.length
        };
    } catch (error) {
        console.error('Error searching routes:', error);
        throw new Error('Failed to search routes');
    }
}

/**
 * Get route details by route name
 * @param routeName - Route name (e.g., "381-C")
 * @param directionId - Direction ID (0 or 1)
 * @returns Route with its stops
 */
export async function getRouteDetails(routeName: string, directionId?: number) {
    try {
        const routesCollection = await getRoutesCollection();
        const stopsCollection = await getStopsCollection();

        const query: any = { name: routeName };
        if (directionId !== undefined) {
            query.direction_id = directionId;
        }

        const route = await routesCollection.findOne(query) as unknown as Route | null;

        if (!route) {
            throw new Error('Route not found');
        }

        // Get all stops for this route
        const stops = await stopsCollection
            .find({ name: { $in: route.stop_list } })
            .toArray() as unknown as Stop[];

        // Sort stops according to stop_list order
        const sortedStops = route.stop_list.map(stopName =>
            stops.find(stop => stop.name === stopName)
        ).filter(Boolean) as Stop[];

        return {
            route,
            stops: sortedStops
        };
    } catch (error) {
        console.error('Error getting route details:', error);
        throw new Error('Failed to get route details');
    }
}

/**
 * Get stop details by stop name
 * @param stopName - Stop name
 * @returns Stop with its routes
 */
export async function getStopDetails(stopName: string) {
    try {
        const stopsCollection = await getStopsCollection();
        const routesCollection = await getRoutesCollection();

        const stop = await stopsCollection.findOne({ name: stopName }) as unknown as Stop | null;

        if (!stop) {
            throw new Error('Stop not found');
        }

        // Get all routes for this stop (filter out test routes)
        const routes = await routesCollection
            .find({
                name: { $in: stop.route_list },
                name: { $not: { $regex: /test/i } }
            })
            .toArray() as unknown as Route[];

        return {
            stop,
            routes
        };
    } catch (error) {
        console.error('Error getting stop details:', error);
        throw new Error('Failed to get stop details');
    }
}

/**
 * Find routes between two stops
 * @param fromStop - Starting stop name
 * @param toStop - Destination stop name
 * @returns Array of routes that connect both stops
 */
export async function findRoutesBetweenStops(fromStop: string, toStop: string) {
    try {
        const routesCollection = await getRoutesCollection();

        // Find routes that contain both stops in their stop_list
        const routes = await routesCollection
            .find({
                stop_list: { $all: [fromStop, toStop] },
                name: { $not: { $regex: /test/i } }
            })
            .toArray() as unknown as Route[];

        // Filter routes where fromStop comes before toStop
        const validRoutes = routes.filter(route => {
            const fromIndex = route.stop_list.indexOf(fromStop);
            const toIndex = route.stop_list.indexOf(toStop);
            return fromIndex < toIndex;
        });

        return validRoutes;
    } catch (error) {
        console.error('Error finding routes between stops:', error);
        throw new Error('Failed to find routes between stops');
    }
}

/**
 * Get nearby stops using geospatial query
 * @param longitude - Longitude coordinate
 * @param latitude - Latitude coordinate
 * @param maxDistance - Maximum distance in meters (default: 1000m = 1km)
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of nearby stops
 */
export async function getNearbyStops(
    longitude: number,
    latitude: number,
    maxDistance: number = 1000,
    limit: number = 10
): Promise<Stop[]> {
    try {
        const stopsCollection = await getStopsCollection();

        const stops = await stopsCollection
            .find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                },
                route_list: { $not: { $regex: /test/i } }
            })
            .limit(limit)
            .toArray() as unknown as Stop[];

        return stops;
    } catch (error) {
        console.error('Error getting nearby stops:', error);
        throw new Error('Failed to get nearby stops');
    }
}
