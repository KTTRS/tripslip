# @tripslip/database

Shared database client and TypeScript types for TripSlip platform applications.

## Overview

This package provides:
- Type-safe Supabase client creation
- Generated TypeScript types from Supabase schema
- Database service layers for business logic
- Comprehensive test suite with property-based testing
- Shared database utilities

## Testing

### Test Suite Status

**376/376 tests passing (100%)**

The database package includes comprehensive testing:
- **Unit Tests**: Service layer testing with mocked dependencies
- **Property-Based Tests**: Correctness properties validated with fast-check
- **Integration Tests**: End-to-end workflow testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run property-based tests
npm run test:property

# Run specific test file
npm test -- venue-booking-service.test.ts

# Run with coverage
npm run test:coverage
```

### Test Categories

- **Access Control**: RLS policy enforcement and permission validation
- **Venue Management**: Venue profiles, media, claiming, and categorization
- **Experience Operations**: Experience CRUD, availability, and pricing
- **Booking System**: Venue bookings, capacity management, and workflows
- **Review System**: Venue reviews, ratings, and moderation
- **Search Functionality**: Text search, geographic search, and filtering
- **Approval Workflow**: Multi-level approval chains and routing
- **Consent Enforcement**: Data sharing consent and privacy controls

## Usage

### Creating a Supabase Client

```tsx
import { createSupabaseClient } from '@tripslip/database';

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Type-safe queries
const { data, error } = await supabase
  .from('experiences')
  .select('*')
  .eq('id', experienceId);
```

### Using Service Layers

```tsx
import { VenueBookingService, ExperienceService } from '@tripslip/database';

const bookingService = new VenueBookingService(supabase);
const experienceService = new ExperienceService(supabase);

// Create a booking with availability check
const result = await bookingService.createBookingWithAvailabilityCheck({
  trip_id: tripId,
  venue_id: venueId,
  experience_id: experienceId,
  scheduled_date: '2024-06-15',
  start_time: '09:00:00',
  end_time: '15:00:00',
  student_count: 25,
  quoted_price_cents: 5000,
});

// Get available experiences
const experiences = await experienceService.getAvailableExperiences(venueId);
```

### Using Types

```tsx
import type { Database } from '@tripslip/database';

type Experience = Database['public']['Tables']['experiences']['Row'];
type ExperienceInsert = Database['public']['Tables']['experiences']['Insert'];
type ExperienceUpdate = Database['public']['Tables']['experiences']['Update'];
```

### Authentication

```tsx
import { createSupabaseClient } from '@tripslip/database';
import type { User, Session } from '@tripslip/database';

const supabase = createSupabaseClient(url, key);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Sign out
await supabase.auth.signOut();
```

## Generating Types

To regenerate types from your Supabase schema:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Generate types
supabase gen types typescript --project-id yvzpgbhinxibebgeevcu > packages/database/src/types.ts
```

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=https://yvzpgbhinxibebgeevcu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Features

- **Type Safety**: Full TypeScript support for all database operations
- **Auto-completion**: IDE auto-completion for table names, columns, and relationships
- **Service Layers**: Business logic encapsulation with validation and error handling
- **Property-Based Testing**: Correctness properties validated with fast-check
- **Row-Level Security**: Automatic enforcement of RLS policies
- **Real-time**: Built-in support for Supabase Realtime subscriptions
- **Auth Integration**: Seamless integration with Supabase Auth

## Available Services

- `VenueProfileService` - Venue profile management
- `VenueMediaService` - Venue photo and document management
- `VenueClaimService` - Venue claiming workflow
- `VenueCategoryService` - Venue categorization and tagging
- `VenueReviewService` - Venue reviews and ratings
- `VenueEmployeeService` - Venue staff management
- `ExperienceService` - Experience CRUD and availability
- `VenueBookingService` - Booking creation and management
- `SearchService` - Venue search and filtering
- `ApprovalWorkflowService` - Trip approval chains and routing
- `BookingMessageService` - Booking communication
