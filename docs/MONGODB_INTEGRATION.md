# MongoDB Integration for OpenBMTC

This document explains the MongoDB integration for the OpenBMTC app.

## 📁 Project Structure

```
OpenBMTC/
├── lib/
│   └── mongodb.ts              # MongoDB connection utility
├── types/
│   └── database.ts             # TypeScript types for DB schema
├── services/
│   └── routeService.ts         # Business logic for routes/stops
├── app/api/
│   ├── stops/
│   │   ├── search+api.ts       # Search stops endpoint
│   │   └── nearby+api.ts       # Nearby stops endpoint
│   └── routes/
│       ├── search+api.ts       # Search routes endpoint
│       └── between+api.ts      # Find routes between stops
└── utils/
    └── api.ts                  # Client-side API functions
```

## 🗄️ Database Schema

### Collections

1. **stops** (9,449 documents)
   - Bus stop information with location data
   - Fields: name, trip_count, trip_list, route_count, route_list, geometry, location

2. **routes** (7,275 documents)
   - Bus route information with stop sequences
   - Fields: name, full_name, trip_count, trip_list, stop_count, stop_list, direction_id, geometry

3. **aggregated** (4,913 documents)
   - Aggregated stop data
   - Fields: name, trip_count, trip_list, route_count, route_list, geometry

## 🔧 Setup

### 1. Environment Variables

Add your MongoDB connection string to `.env.local`:

```env
MONGO_DB=mongodb+srv://username:password@cluster.mongodb.net/bmtc?retryWrites=true&w=majority
```

### 2. Install Dependencies

```bash
npm install mongodb --legacy-peer-deps
```

### 3. Database Indexes (Recommended)

For optimal performance, create these indexes in MongoDB:

```javascript
// Stops collection
db.stops.createIndex({ name: "text" });
db.stops.createIndex({ location: "2dsphere" });
db.stops.createIndex({ route_list: 1 });

// Routes collection
db.routes.createIndex({ name: "text", full_name: "text" });
db.routes.createIndex({ stop_list: 1 });
db.routes.createIndex({ name: 1, direction_id: 1 });
```

## 📡 API Endpoints

### Search Stops
```
GET /api/stops/search?q=<query>&limit=<number>
```
**Example:**
```
GET /api/stops/search?q=Majestic&limit=10
```

### Search Routes
```
GET /api/routes/search?q=<query>&limit=<number>
```
**Example:**
```
GET /api/routes/search?q=381&limit=10
```

### Find Routes Between Stops
```
GET /api/routes/between?from=<stop_name>&to=<stop_name>
```
**Example:**
```
GET /api/routes/between?from=Majestic&to=Koramangala
```

### Get Nearby Stops
```
GET /api/stops/nearby?lat=<latitude>&lng=<longitude>&maxDistance=<meters>&limit=<number>
```
**Example:**
```
GET /api/stops/nearby?lat=12.9716&lng=77.5946&maxDistance=1000&limit=10
```

## 💻 Usage in React Native

### Import the API utilities

```typescript
import { 
  searchStopsAPI, 
  searchRoutesAPI, 
  findRoutesBetweenStopsAPI,
  getNearbyStopsAPI,
  searchAll 
} from '../utils/api';
```

### Example: Search for stops

```typescript
const handleSearch = async (query: string) => {
  try {
    const result = await searchStopsAPI(query, 10);
    console.log('Found stops:', result.stops);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

### Example: Find routes between two stops

```typescript
const findRoutes = async () => {
  try {
    const result = await findRoutesBetweenStopsAPI('Majestic', 'Koramangala');
    console.log('Available routes:', result.routes);
  } catch (error) {
    console.error('Failed to find routes:', error);
  }
};
```

### Example: Get nearby stops

```typescript
const getNearby = async (lat: number, lng: number) => {
  try {
    const result = await getNearbyStopsAPI(lat, lng, 1000, 10);
    console.log('Nearby stops:', result.stops);
  } catch (error) {
    console.error('Failed to get nearby stops:', error);
  }
};
```

## 🧪 Test Data Filtering

All API functions automatically filter out test data by excluding:
- Routes with names containing "test" (case-insensitive)
- Stops associated with test routes

This is handled in the `routeService.ts` functions using regex filters:
```typescript
name: { $not: { $regex: /test/i } }
```

## 🚀 Next Steps

1. **Implement Search UI**: Create a search component in your React Native app
2. **Add Route Details Screen**: Show full route information with stops
3. **Implement Map Integration**: Display stops and routes on the map
4. **Add Favorites**: Allow users to save favorite routes/stops
5. **Real-time Updates**: Consider adding real-time bus tracking if available

## 🔍 TypeScript Types

All database types are defined in `types/database.ts`:
- `Stop`: Bus stop document type
- `Route`: Bus route document type
- `AggregatedStop`: Aggregated stop data type
- `Geometry`: GeoJSON geometry type

## 📝 Notes

- The MongoDB connection uses connection pooling for efficiency
- In development, the connection is cached globally to prevent multiple connections
- All geospatial queries use the `location` field with 2dsphere index
- Route direction is indicated by `direction_id` (0 or 1)

## 🐛 Troubleshooting

### Connection Issues
- Verify your MongoDB connection string in `.env.local`
- Ensure your IP is whitelisted in MongoDB Atlas
- Check network connectivity

### API Not Working
- Make sure the API routes are in the correct directory structure
- Verify Expo Router is configured correctly
- Check console for error messages

### Performance Issues
- Create the recommended indexes
- Consider implementing pagination for large result sets
- Use appropriate limit parameters in queries
