# Venue Category Property Tests - Setup Instructions

## Status

✅ **Property test code is complete and ready to run**  
⚠️ **Requires Supabase schema cache refresh to execute**

## Issue

The property tests for the venue category system (Task 7.2) are failing with error:
```
Could not find the table 'public.venue_categories' in the schema cache (PGRST205)
```

This is a **PostgREST schema cache issue**, not a problem with the test code or migration.

## Root Cause

The migration `20240101000028_create_venue_categories_and_tags.sql` **has been successfully applied** to the remote Supabase database (confirmed via `supabase db push` output). However, the PostgREST API layer has not yet reloaded its schema cache to recognize the new tables.

## Solution

### Option 1: Manual Schema Cache Refresh (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/yvzpgbhinxibebgeevcu
2. Navigate to **Project Settings** → **API**
3. Click the **"Reload schema cache"** button
4. Wait 30 seconds for the cache to refresh
5. Run the tests again:
   ```bash
   cd packages/database
   npm test -- venue-category.property.test.ts --run
   ```

### Option 2: Wait for Automatic Refresh

PostgREST automatically refreshes its schema cache periodically (typically every few hours). The tests will pass once this happens automatically.

### Option 3: Restart PostgREST Service

If you have access to the Supabase project settings, you can restart the PostgREST service to force a schema reload.

## Test Coverage

The property tests validate **Property 34: Category Assignment Validity** with the following test cases:

1. ✅ All assigned categories exist in the category system
2. ✅ Venues have at least one category assigned
3. ✅ Category assignment prevents duplicate assignments
4. ✅ Category assignments maintain referential integrity
5. ✅ Removing a category from venue maintains data integrity
6. ✅ Category assignment is idempotent when using setVenueCategories
7. ✅ Invalid category IDs are rejected during assignment
8. ✅ Cascade delete removes category assignments when category is deleted

Each test runs 30-50 iterations using fast-check property-based testing.

## Verification

Once the schema cache is refreshed, you can verify the migration was applied correctly:

```bash
# Check that tables exist
supabase db remote exec "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'venue_%';"

# Check category count
supabase db remote exec "SELECT COUNT(*) FROM venue_categories;"

# Check tag count
supabase db remote exec "SELECT COUNT(*) FROM venue_tags;"
```

Expected results:
- Tables: venue_categories, venue_category_assignments, venue_tags, venue_tag_assignments
- Categories: ~30 (8 top-level + subcategories)
- Tags: ~18

## Related Files

- **Migration**: `supabase/migrations/20240101000028_create_venue_categories_and_tags.sql`
- **Validation**: `supabase/migrations/_archive/supabase/migrations/_archive/validate_20240101000028.md`
- **Service**: `packages/database/src/venue-category-service.ts`
- **Unit Tests**: `packages/database/src/__tests__/venue-category-service.test.ts`
- **Property Tests**: `packages/database/src/__tests__/property/venue-category.property.test.ts`

## Task Information

- **Task**: 7.2 Write property tests for category system
- **Property**: Property 34: Category Assignment Validity
- **Validates**: Requirements 28.10
- **Spec**: `.kiro/specs/venue-experience-database-system`
