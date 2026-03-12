# Experience Management System

## Overview

The Experience Management System provides comprehensive CRUD operations for venue experiences with support for educational objectives, curriculum standards, pricing tiers, cancellation policies, and active/inactive status management.

## Features

- ✅ Create, read, update, and delete experiences
- ✅ Educational objectives and curriculum standards alignment
- ✅ Flexible pricing tiers with group discounts
- ✅ Additional fees (materials, equipment, etc.)
- ✅ Cancellation policies with refund terms
- ✅ Age range and grade level recommendations
- ✅ Active/inactive status for search visibility
- ✅ Experience duplication for templating
- ✅ Form association for required documents
- ✅ Comprehensive validation

## Requirements Addressed

- **Requirement 2.1**: Store experience name, description, educational objectives, and duration
- **Requirement 2.2**: Store pricing information including base price, per-student pricing, and group discounts
- **Requirement 2.3**: Store minimum and maximum group sizes
- **Requirement 2.4**: Store recommended age ranges and grade levels
- **Requirement 2.5**: Store subject area alignments and curriculum standards
- **Requirement 2.8**: Store cancellation policies and refund terms
- **Requirement 8.1**: Create new experience records
- **Requirement 8.2**: Modify experience descriptions, pricing, and duration
- **Requirement 8.3**: Set minimum and maximum group sizes
- **Requirement 8.4**: Specify age ranges and grade levels
- **Requirement 8.5**: Associate venue form documents with experiences
- **Requirement 8.6**: Mark experiences as active or inactive
- **Requirement 8.7**: Hide inactive experiences from search results
- **Requirement 8.8**: Duplicate existing experiences as templates
- **Requirement 8.9**: Validate that pricing values are positive numbers
- **Requirement 8.10**: Require experience name, description, and duration before saving

## Database Schema

### Experiences Table Extensions

```sql
ALTER TABLE experiences 
ADD COLUMN educational_objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN recommended_age_min INTEGER,
ADD COLUMN recommended_age_max INTEGER,
ADD COLUMN cancellation_policy JSONB DEFAULT '{...}'::jsonb,
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN special_requirements TEXT;
```

### Pricing Tiers Table Extensions

```sql
ALTER TABLE pricing_tiers 
ADD COLUMN additional_fees JSONB DEFAULT '[]'::jsonb;
```

## Usage

### Initialize the Service

```typescript
import { createSupabaseClient } from '@/database';
import { createExperienceService } from '@/database';

const supabase = createSupabaseClient();
const experienceService = createExperienceService(supabase);
```

### Create an Experience

```typescript
const experience = await experienceService.createExperience({
  venueId: 'venue-uuid',
  title: 'Ancient Egypt Tour',
  description: 'Explore the wonders of ancient Egypt through interactive exhibits',
  educationalObjectives: [
    'Understand ancient Egyptian civilization',
    'Analyze hieroglyphic writing systems',
    'Compare ancient and modern cultures'
  ],
  durationMinutes: 90,
  capacity: 50,
  minStudents: 10,
  maxStudents: 50,
  recommendedAgeMin: 8,
  recommendedAgeMax: 14,
  gradeLevels: ['3rd', '4th', '5th', '6th', '7th', '8th'],
  subjects: ['History', 'Social Studies', 'Art'],
  curriculumStandards: [
    {
      framework: 'Common Core',
      code: 'CCSS.ELA-LITERACY.RH.6-8.7',
      description: 'Integrate visual information with other information'
    }
  ],
  pricingTiers: [
    {
      minStudents: 1,
      maxStudents: 20,
      priceCents: 1500, // $15 per student
      freeChaperones: 2,
      additionalFees: [
        { name: 'Activity Workbook', amountCents: 300, required: false }
      ]
    },
    {
      minStudents: 21,
      maxStudents: 50,
      priceCents: 1200, // $12 per student (group discount)
      freeChaperones: 3
    }
  ],
  cancellationPolicy: {
    fullRefundDays: 14,
    partialRefundDays: 7,
    partialRefundPercent: 50,
    noRefundAfterDays: 3
  },
  active: true,
  published: true
});
```

### Get an Experience

```typescript
const experience = await experienceService.getExperience('experience-uuid');

console.log(experience.title);
console.log(experience.educationalObjectives);
console.log(experience.pricingTiers);
```

### Get All Experiences for a Venue

```typescript
// Get only active experiences
const activeExperiences = await experienceService.getVenueExperiences('venue-uuid');

// Get all experiences including inactive
const allExperiences = await experienceService.getVenueExperiences('venue-uuid', true);
```

### Update an Experience

```typescript
const updated = await experienceService.updateExperience('experience-uuid', {
  title: 'Updated Title',
  description: 'Updated description',
  durationMinutes: 120,
  educationalObjectives: [
    'New objective 1',
    'New objective 2'
  ],
  recommendedAgeMin: 10,
  recommendedAgeMax: 16
});
```

### Mark Experience as Active/Inactive

```typescript
// Deactivate an experience (hides from search)
await experienceService.setExperienceActive('experience-uuid', false);

// Reactivate an experience
await experienceService.setExperienceActive('experience-uuid', true);
```

### Duplicate an Experience

```typescript
// Duplicate with auto-generated title
const duplicate = await experienceService.duplicateExperience('experience-uuid');
// Title will be "Original Title (Copy)"

// Duplicate with custom title
const duplicate = await experienceService.duplicateExperience(
  'experience-uuid',
  'Summer Camp Version'
);
```

### Update Pricing Tiers

```typescript
await experienceService.updatePricingTiers('experience-uuid', [
  {
    minStudents: 1,
    maxStudents: 15,
    priceCents: 2000,
    freeChaperones: 2,
    additionalFees: [
      { name: 'Materials Fee', amountCents: 500, required: true }
    ]
  },
  {
    minStudents: 16,
    maxStudents: 30,
    priceCents: 1800,
    freeChaperones: 3
  }
]);
```

### Link Forms to Experience

```typescript
// Link required forms
await experienceService.linkFormsToExperience(
  'experience-uuid',
  ['form-uuid-1', 'form-uuid-2'],
  true // required
);

// Get linked forms
const forms = await experienceService.getExperienceForms('experience-uuid');
```

### Delete an Experience

```typescript
await experienceService.deleteExperience('experience-uuid');
```

## Data Types

### Experience

```typescript
interface Experience {
  id: string;
  venueId: string;
  title: string;
  description: string | null;
  educationalObjectives: string[];
  
  // Logistics
  durationMinutes: number;
  capacity: number;
  minStudents: number | null;
  maxStudents: number | null;
  recommendedAgeMin: number | null;
  recommendedAgeMax: number | null;
  gradeLevels: string[];
  
  // Educational alignment
  subjects: string[];
  curriculumStandards: CurriculumStandard[];
  
  // Pricing
  pricingTiers?: PricingTier[];
  cancellationPolicy: CancellationPolicy;
  
  // Requirements
  specialRequirements: string | null;
  
  // Status
  active: boolean;
  published: boolean;
  
  createdAt: string;
  updatedAt: string;
}
```

### CurriculumStandard

```typescript
interface CurriculumStandard {
  framework: string; // e.g., "Common Core", "NGSS", "State Standards"
  code: string; // e.g., "CCSS.MATH.CONTENT.5.NBT.A.1"
  description: string;
}
```

### PricingTier

```typescript
interface PricingTier {
  id?: string;
  experienceId?: string;
  minStudents: number;
  maxStudents: number;
  priceCents: number;
  freeChaperones: number;
  additionalFees?: AdditionalFee[];
}
```

### AdditionalFee

```typescript
interface AdditionalFee {
  name: string;
  amountCents: number;
  required: boolean;
}
```

### CancellationPolicy

```typescript
interface CancellationPolicy {
  fullRefundDays: number; // Days before trip for full refund
  partialRefundDays: number; // Days before trip for partial refund
  partialRefundPercent: number; // Percentage refunded (0-100)
  noRefundAfterDays: number; // Days before trip when no refund is available
}
```

## Validation Rules

### Required Fields
- `title`: Must be non-empty
- `durationMinutes`: Must be provided
- `capacity`: Must be provided

### Pricing Validation
- All pricing values must be positive numbers (>= 0)
- Additional fee amounts must be positive numbers (>= 0)

### Age Range Validation
- If age range is specified, both min and max must be provided
- `recommendedAgeMin` must be <= `recommendedAgeMax`

### Status Rules
- Inactive experiences (`active: false`) are hidden from search results
- Duplicated experiences start as inactive and unpublished

## Error Handling

The service throws descriptive errors for common issues:

```typescript
try {
  await experienceService.createExperience(input);
} catch (error) {
  // Possible errors:
  // - "Experience name, description, and duration are required"
  // - "Pricing values must be positive numbers"
  // - "Additional fee amounts must be positive numbers"
  // - "Failed to create experience: [database error]"
}
```

## Testing

Run the test suite:

```bash
cd packages/database
npm test experience-service.test.ts
```

The test suite covers:
- ✅ Creating experiences with all field combinations
- ✅ Validation of required fields
- ✅ Validation of pricing values
- ✅ Retrieving experiences
- ✅ Updating experiences
- ✅ Active/inactive status management
- ✅ Experience duplication
- ✅ Pricing tier management
- ✅ Form linking
- ✅ Deletion

## Performance Considerations

### Indexes

The following indexes optimize common queries:

- `idx_experiences_active`: Fast filtering of active experiences
- `idx_experiences_published_active`: Fast filtering of published and active experiences
- `idx_experiences_age_range`: Fast filtering by age range

### Query Optimization

- Use `getVenueExperiences()` to fetch all experiences for a venue in a single query
- Pricing tiers are fetched in batch to minimize database round trips
- Consider caching frequently accessed experiences

## Security

### Row Level Security (RLS)

The experiences table has RLS policies that:
- Allow public read access to published experiences
- Restrict write access to venue employees with appropriate roles
- Prevent unauthorized modifications

### Permission Checks

Before calling write operations, ensure the user has the appropriate venue role:
- **Administrator**: Full access to all operations
- **Editor**: Can create, update, and manage experiences
- **Viewer**: Read-only access

## Migration

The migration `20240101000025_extend_experiences_table.sql` adds:
- New columns to experiences table
- Additional fees column to pricing_tiers table
- Indexes for performance
- Constraints for data integrity

See `supabase/migrations/_archive/validate_20240101000025.md` for validation queries and rollback procedures.

## Future Enhancements

Potential future improvements:
- [ ] Experience templates library
- [ ] Seasonal pricing variations
- [ ] Multi-language support for descriptions
- [ ] Experience ratings and reviews
- [ ] Availability calendar integration
- [ ] Automated pricing recommendations
- [ ] Bulk import/export functionality

## Support

For issues or questions:
1. Check the validation document: `supabase/migrations/_archive/validate_20240101000025.md`
2. Review test cases: `__tests__/experience-service.test.ts`
3. Consult the design document: `.kiro/specs/venue-experience-database-system/design.md`
