# Search Service Documentation

## Overview

The Search Service provides comprehensive venue discovery functionality with support for text search, geographic filtering, multi-criteria filtering, and flexible sorting options. It implements Requirements 3.1-3.9 from the Venue Experience Database and Discovery System specification.

## Features

### Text Search (Requirement 3.1)
- Full-text search across venue names and descriptions
- PostgreSQL websearch syntax support
- Relevance-based ranking

### Geographic Search (Requirement 3.2)
- Radius-based search using PostGIS
- Distance calculations in miles
- Efficient spatial indexing

### Multi-Criteria Filtering (Requirements 3.3-3.5)
- Subject areas
- Grade levels
- Age groups
- Capacity ranges
- Price ranges
- Accessibility features
- Verification status

### Sorting Options (Requirement 3.8)
- Relevance (default)
- Distance
- Rating
- Price

### Pagination
- Cursor-based pagination
- Configurable page sizes
- Efficient for large result sets

### Search Facets
- Subject area counts
- Price range distribution
- Age group availability
- Enables dynamic filter UI

## Usage

### Basic Text Search

```typescript
import { createSearchService } from '@tripslip/database';

const searchService = createSearchService(supabase);

const results = await searchService.searchVenues({
  query: 'science museum',
  limit: 25
});

console.log(`Found ${results.total} venues`);
results.venues.forEach(venue => {
  console.log(`${venue.name} - Rating: ${venue.rating}`);
});
```

### Geographic Search

```typescript
const results = await searchService.searchVenues({
  location: { lat: 40.7128, lng: -74.0060 }, // New York City
  radiusMiles: 25,
  sortBy: 'distance'
});

results.venues.forEach(venue => {
  console.log(`${venue.name} - ${venue.distanceMiles?.toFixed(1)} miles away`);
});
```

### Multi-Criteria Search

```typescript
const results = await searchService.searchVenues({
  query: 'museum',
  location: { lat: 40.7128, lng: -74.0060 },
  radiusMiles: 50,
  subjectAreas: ['science', 'history'],
  gradeLevels: ['elementary', 'middle'],
  ageGroups: ['elementary'],
  minCapacity: 20,
  maxCapacity: 100,
  maxPricePerStudent: 25,
  accessibilityFeatures: ['wheelchair'],
  verifiedOnly: true,
  sortBy: 'rating',
  limit: 10
});
```

### Pagination

```typescript
// First page
const page1 = await searchService.searchVenues({
  query: 'museum',
  limit: 25
});

// Next page
if (page1.nextCursor) {
  const page2 = await searchService.searchVenues({
    query: 'museum',
    limit: 25,
    cursor: page1.nextCursor
  });
}
```

### Using Facets for Filters

```typescript
const results = await searchService.searchVenues({
  query: 'museum'
});

// Display available filters
console.log('Subject Areas:');
results.facets.subjectAreas.forEach(facet => {
  console.log(`  ${facet.name} (${facet.count})`);
});

console.log('Price Ranges:');
results.facets.priceRanges.forEach(facet => {
  console.log(`  ${facet.range} (${facet.count})`);
});
```

## API Reference

### SearchQuery Interface

```typescript
interface SearchQuery {
  // Text search
  query?: string;
  
  // Geographic filters
  location?: { lat: number; lng: number };
  radiusMiles?: number;
  
  // Categorical filters
  categories?: string[];
  subjectAreas?: string[];
  gradeLevels?: string[];
  ageGroups?: AgeGroup[];
  
  // Capacity and logistics
  minCapacity?: number;
  maxCapacity?: number;
  availableDate?: string; // YYYY-MM-DD format
  
  // Pricing
  maxPricePerStudent?: number;
  
  // Accessibility
  accessibilityFeatures?: string[];
  
  // Status filters
  verifiedOnly?: boolean;
  claimedOnly?: boolean;
  
  // Sorting
  sortBy?: 'relevance' | 'distance' | 'rating' | 'price';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  cursor?: string;
}
```

### SearchResult Interface

```typescript
interface SearchResult {
  venues: VenueSearchHit[];
  total: number;
  nextCursor?: string;
  facets: SearchFacets;
  executionTimeMs: number;
}
```

### VenueSearchHit Interface

```typescript
interface VenueSearchHit {
  id: string;
  name: string;
  description: string | null;
  primaryPhotoUrl: string | null;
  location: { lat: number; lng: number } | null;
  distanceMiles?: number;
  rating: number;
  reviewCount: number;
  priceRange: { min: number; max: number } | null;
  verified: boolean;
  claimed: boolean;
  categories: string[];
  subjectAreas: string[];
  capacityRange: { min: number; max: number } | null;
  accessibilityFeatures: string[];
  profileCompleteness: number;
}
```

## Performance Considerations

### Database Indexes

The search service relies on several indexes for optimal performance:

1. **Full-text search index** (GIN):
   ```sql
   CREATE INDEX idx_venues_search ON venues 
   USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
   ```

2. **Geographic index** (GIST):
   ```sql
   CREATE INDEX idx_venues_location ON venues USING GIST(location);
   ```

3. **Composite indexes** for common filters:
   ```sql
   CREATE INDEX idx_venues_verified_rating ON venues(verified, rating DESC);
   ```

### Performance Targets

- **Search execution time**: < 2 seconds for queries with < 1000 matching venues (Requirement 3.9)
- **Geographic queries**: Optimized with PostGIS spatial indexes
- **Text search**: Uses PostgreSQL full-text search with GIN indexes

### Optimization Tips

1. **Use geographic filters** when possible to reduce result set size
2. **Apply verified filter** to focus on quality venues
3. **Limit result size** to reasonable page sizes (25-50 items)
4. **Use cursor-based pagination** instead of offset-based for large result sets

## Filter Behavior

### Conjunction Logic (Requirement 3.6)

When multiple filters are applied, they work together using AND logic:

```typescript
// This finds venues that match ALL criteria:
// - Within 25 miles of location
// - Has "science" subject area
// - Capacity between 20-100
// - Price under $25 per student
const results = await searchService.searchVenues({
  location: { lat: 40.7128, lng: -74.0060 },
  radiusMiles: 25,
  subjectAreas: ['science'],
  minCapacity: 20,
  maxCapacity: 100,
  maxPricePerStudent: 25
});
```

### Experience-Based Filtering

Some filters (subject areas, price) are applied at the experience level:
- A venue matches if **any** of its experiences meet the criteria
- Venues without active experiences are excluded from results

### Accessibility Filtering

Accessibility filters require **all** specified features to be available:

```typescript
// Venue must have BOTH wheelchair access AND accessible parking
const results = await searchService.searchVenues({
  accessibilityFeatures: ['wheelchair', 'parking']
});
```

## Error Handling

The search service throws errors for:
- Database connection failures
- Invalid query parameters
- RPC function failures (with fallback to client-side calculations)

```typescript
try {
  const results = await searchService.searchVenues(query);
} catch (error) {
  console.error('Search failed:', error.message);
  // Handle error appropriately
}
```

## Testing

### Unit Tests

Run the test suite:

```bash
npm test -- search-service.test.ts
```

### Integration Tests

Test with real database:

```typescript
import { createSupabaseClient } from '@tripslip/database';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const searchService = createSearchService(supabase);

// Run test searches
const results = await searchService.searchVenues({
  query: 'museum',
  limit: 5
});

console.log(`Found ${results.total} venues in ${results.executionTimeMs}ms`);
```

## Migration Dependencies

The search service requires these migrations to be applied:

1. `20240101000020_extend_venues_table.sql` - Adds search-related columns and indexes
2. `20240101000026_create_search_functions.sql` - Creates PostGIS search functions

## Future Enhancements

Potential improvements for future iterations:

1. **Category filtering** - Once venue categories are implemented
2. **Availability date filtering** - Check real-time availability
3. **Redis caching** - Cache frequent searches for 5 minutes
4. **Elasticsearch integration** - For advanced search features
5. **Search analytics** - Track popular searches and click-through rates
6. **Personalized results** - Based on user preferences and history
7. **Autocomplete** - Suggest venues as user types
8. **Saved searches** - Allow users to save and rerun searches

## Related Documentation

- [Venue Profile Service](./src/venue-profile-service.ts)
- [Experience Management](./EXPERIENCE_MANAGEMENT.md)
- [Database Schema](../../supabase/schema.sql)
- [Requirements Document](../../.kiro/specs/venue-experience-database-system/requirements.md)
- [Design Document](../../.kiro/specs/venue-experience-database-system/design.md)
