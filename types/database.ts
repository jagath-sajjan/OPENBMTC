// MongoDB Document Types

export interface Geometry {
    type: 'Point' | 'LineString';
    coordinates: number[] | number[][];
}

export interface Stop {
    _id: string;
    name: string;
    trip_count: number;
    trip_list: string[];
    route_count: number;
    route_list: string[];
    id: string;
    geometry?: Geometry;
    location?: Geometry;
}

export interface Route {
    _id: string;
    name: string;
    full_name: string;
    trip_count: number;
    trip_list: string[];
    stop_count: number;
    stop_list: string[];
    id: string;
    direction_id: number;
    geometry?: Geometry;
}

export interface AggregatedStop {
    _id: string;
    name: string;
    trip_count: number;
    trip_list: string[];
    route_count: number;
    route_list: string[];
    geometry?: Geometry;
}

// API Response Types

export interface SearchStopsResponse {
    stops: Stop[];
    total: number;
}

export interface SearchRoutesResponse {
    routes: Route[];
    total: number;
}

export interface RouteDetailsResponse {
    route: Route;
    stops: Stop[];
}

export interface StopDetailsResponse {
    stop: Stop;
    routes: Route[];
}
