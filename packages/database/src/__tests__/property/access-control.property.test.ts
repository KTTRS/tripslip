/**
 * Property-Based Tests - Role-Based Access Control (Task 4.2)
 * 
 * Tests Property 12: Role-Based Access Control
 * 
 * **Validates: Requirements 6.6, 6.7, 6.8, 6.9**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ROLE_PERMISSIONS, type VenueRole } from '../../venue-employee-service';

// =====================================================
// TEST SETUP
// =====================================================

// Note: These tests validate the business logic for role-based access control
// They use mock data structures to test the properties without requiring
// a live database connection. Integration tests with real database
// connections should be run separately in a test environment.

let mockVenueUsers: Map<string, any>;
let mockVenues: Map<string, any>;
let mockExperiences: Map<string, any>;

beforeEach(async () => {
  // Initialize mock data stores
  mockVenueUsers = new Map();
  mockVenues = new Map();
  mockExperiences = new Map();
});

afterEach(async () => {
  // Clear mock data
  mockVenueUsers.clear();
  mockVenues.clear();
  mockExperiences.clear();
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create a test venue
 */
function createTestVenue(): string {
  const venueId = `venue-${Date.now()}-${Math.random()}`;
  mockVenues.set(venueId, {
    id: venueId,
    name: `Test Venue ${venueId}`,
    description: 'Test venue description',
    claimed: true,
  });
  return venueId;
}

/**
 * Create a test user
 */
function createTestUser(): string {
  const userId = `user-${Date.now()}-${Math.random()}`;
  return userId;
}

/**
 * Create a test experience
 */
function createTestExperience(venueId: string): string {
  const experienceId = `exp-${Date.now()}-${Math.random()}`;
  mockExperiences.set(experienceId, {
    id: experienceId,
    venue_id: venueId,
    title: `Test Experience ${experienceId}`,
    active: true,
  });
  return experienceId;
}

/**
 * Assign a role to a user for a venue
 */
function assignRole(userId: string, venueId: string, role: VenueRole): void {
  const key = `${venueId}-${userId}`;
  mockVenueUsers.set(key, {
    venue_id: venueId,
    user_id: userId,
    role: role,
    deactivated_at: null,
  });
}

/**
 * Check if a user has a specific permission for a venue
 * This implements the business logic from Requirements 6.6, 6.7, 6.8, 6.9
 */
function hasPermission(userId: string, venueId: string, permission: string): boolean {
  const key = `${venueId}-${userId}`;
  const venueUser = mockVenueUsers.get(key);
  
  if (!venueUser || venueUser.deactivated_at !== null) {
    return false;
  }
  
  const role = venueUser.role as VenueRole;
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  return permissions.includes(permission);
}

/**
 * Simulate attempting to delete a venue profile
 * Requirement 6.6: Restrict profile deletion to administrator access level only
 */
function attemptVenueDelete(userId: string, venueId: string): { success: boolean; error?: string } {
  if (!hasPermission(userId, venueId, 'venue.delete')) {
    return { success: false, error: 'Insufficient permissions to delete venue' };
  }
  
  const venue = mockVenues.get(venueId);
  if (!venue) {
    return { success: false, error: 'Venue not found' };
  }
  
  mockVenues.delete(venueId);
  return { success: true };
}

/**
 * Simulate attempting to modify financial settings
 * Requirement 6.7: Restrict financial settings modification to administrator access level only
 */
function attemptFinancialSettingsModification(
  userId: string,
  venueId: string,
  newSettings: any
): { success: boolean; error?: string } {
  if (!hasPermission(userId, venueId, 'financial.read')) {
    return { success: false, error: 'Insufficient permissions to modify financial settings' };
  }
  
  const venue = mockVenues.get(venueId);
  if (!venue) {
    return { success: false, error: 'Venue not found' };
  }
  
  venue.financial_settings = newSettings;
  return { success: true };
}

/**
 * Simulate attempting to modify venue information
 * Requirement 6.8: Allow editors to modify venue information, experiences, and media
 */
function attemptVenueModification(
  userId: string,
  venueId: string,
  updates: any
): { success: boolean; error?: string } {
  if (!hasPermission(userId, venueId, 'venue.write')) {
    return { success: false, error: 'Insufficient permissions to modify venue' };
  }
  
  const venue = mockVenues.get(venueId);
  if (!venue) {
    return { success: false, error: 'Venue not found' };
  }
  
  Object.assign(venue, updates);
  return { success: true };
}

/**
 * Simulate attempting to modify an experience
 * Requirement 6.8: Allow editors to modify venue information, experiences, and media
 */
function attemptExperienceModification(
  userId: string,
  venueId: string,
  experienceId: string,
  updates: any
): { success: boolean; error?: string } {
  if (!hasPermission(userId, venueId, 'experience.write')) {
    return { success: false, error: 'Insufficient permissions to modify experience' };
  }
  
  const experience = mockExperiences.get(experienceId);
  if (!experience) {
    return { success: false, error: 'Experience not found' };
  }
  
  if (experience.venue_id !== venueId) {
    return { success: false, error: 'Experience does not belong to this venue' };
  }
  
  Object.assign(experience, updates);
  return { success: true };
}

/**
 * Simulate attempting to read venue data
 * Requirement 6.9: Allow viewers to access venue data and booking information without modification rights
 */
function attemptVenueRead(userId: string, venueId: string): { success: boolean; data?: any; error?: string } {
  if (!hasPermission(userId, venueId, 'venue.read')) {
    return { success: false, error: 'Insufficient permissions to read venue' };
  }
  
  const venue = mockVenues.get(venueId);
  if (!venue) {
    return { success: false, error: 'Venue not found' };
  }
  
  return { success: true, data: venue };
}

/**
 * Simulate attempting to read booking information
 * Requirement 6.9: Allow viewers to access venue data and booking information without modification rights
 */
function attemptBookingRead(userId: string, venueId: string): { success: boolean; error?: string } {
  if (!hasPermission(userId, venueId, 'booking.read')) {
    return { success: false, error: 'Insufficient permissions to read bookings' };
  }
  
  return { success: true };
}

// =====================================================
// CUSTOM ARBITRARIES
// =====================================================

/**
 * Generate a valid venue role
 */
const roleArbitrary = fc.constantFrom<VenueRole>('administrator', 'editor', 'viewer');

/**
 * Generate venue update data
 */
const venueUpdateArbitrary = fc.record({
  description: fc.string({ minLength: 10, maxLength: 500 }),
  contact_email: fc.emailAddress(),
  contact_phone: fc.string({ minLength: 10, maxLength: 15 }),
});

/**
 * Generate experience update data
 */
const experienceUpdateArbitrary = fc.record({
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  duration_minutes: fc.integer({ min: 30, max: 480 }),
});

/**
 * Generate financial settings data
 */
const financialSettingsArbitrary = fc.record({
  payment_terms: fc.constantFrom('deposit', 'full_payment', 'payment_on_arrival'),
  deposit_percentage: fc.integer({ min: 10, max: 50 }),
  cancellation_fee_percentage: fc.integer({ min: 0, max: 100 }),
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Property 12: Role-Based Access Control (Task 4.2)', () => {
  /**
   * **Validates: Requirement 6.6**
   * 
   * For any user attempting to delete a venue profile, the action SHALL succeed 
   * if and only if the user has the 'administrator' role for that venue.
   */
  it('restricts profile deletion to administrators only', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        async (role) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign the role to the user
          assignRole(userId, venueId, role);
          
          // Attempt to delete the venue
          const result = attemptVenueDelete(userId, venueId);
          
          // Should succeed only for administrators
          if (role === 'administrator') {
            expect(result.success).toBe(true);
            expect(mockVenues.has(venueId)).toBe(false);
          } else {
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/insufficient permissions/i);
            expect(mockVenues.has(venueId)).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * **Validates: Requirement 6.7**
   * 
   * For any user attempting to modify financial settings, the action SHALL succeed 
   * if and only if the user has the 'administrator' role for that venue.
   */
  it('restricts financial settings modification to administrators only', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        financialSettingsArbitrary,
        async (role, financialSettings) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign the role to the user
          assignRole(userId, venueId, role);
          
          // Attempt to modify financial settings
          const result = attemptFinancialSettingsModification(userId, venueId, financialSettings);
          
          // Should succeed only for administrators
          if (role === 'administrator') {
            expect(result.success).toBe(true);
            const venue = mockVenues.get(venueId);
            expect(venue?.financial_settings).toEqual(financialSettings);
          } else {
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/insufficient permissions/i);
            const venue = mockVenues.get(venueId);
            expect(venue?.financial_settings).toBeUndefined();
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * **Validates: Requirement 6.8**
   * 
   * For any user attempting to modify venue information, the action SHALL succeed 
   * if and only if the user has the 'administrator' or 'editor' role for that venue.
   */
  it('allows administrators and editors to modify venue information', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        venueUpdateArbitrary,
        async (role, updates) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Store original description
          const originalDescription = mockVenues.get(venueId)?.description;
          
          // Assign the role to the user
          assignRole(userId, venueId, role);
          
          // Attempt to modify venue information
          const result = attemptVenueModification(userId, venueId, updates);
          
          // Should succeed for administrators and editors
          if (role === 'administrator' || role === 'editor') {
            expect(result.success).toBe(true);
            const venue = mockVenues.get(venueId);
            expect(venue?.description).toBe(updates.description);
            expect(venue?.contact_email).toBe(updates.contact_email);
          } else {
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/insufficient permissions/i);
            const venue = mockVenues.get(venueId);
            expect(venue?.description).toBe(originalDescription);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * **Validates: Requirement 6.8**
   * 
   * For any user attempting to modify experiences, the action SHALL succeed 
   * if and only if the user has the 'administrator' or 'editor' role for that venue.
   */
  it('allows administrators and editors to modify experiences', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        experienceUpdateArbitrary,
        async (role, updates) => {
          // Create a venue, experience, and user
          const venueId = createTestVenue();
          const experienceId = createTestExperience(venueId);
          const userId = createTestUser();
          
          // Store original title
          const originalTitle = mockExperiences.get(experienceId)?.title;
          
          // Assign the role to the user
          assignRole(userId, venueId, role);
          
          // Attempt to modify experience
          const result = attemptExperienceModification(userId, venueId, experienceId, updates);
          
          // Should succeed for administrators and editors
          if (role === 'administrator' || role === 'editor') {
            expect(result.success).toBe(true);
            const experience = mockExperiences.get(experienceId);
            expect(experience?.title).toBe(updates.title);
            expect(experience?.duration_minutes).toBe(updates.duration_minutes);
          } else {
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/insufficient permissions/i);
            const experience = mockExperiences.get(experienceId);
            expect(experience?.title).toBe(originalTitle);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * **Validates: Requirement 6.9**
   * 
   * For any user attempting to read venue data, the action SHALL succeed 
   * if the user has any role (administrator, editor, or viewer) for that venue.
   */
  it('allows all roles to read venue data', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        async (role) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign the role to the user
          assignRole(userId, venueId, role);
          
          // Attempt to read venue data
          const result = attemptVenueRead(userId, venueId);
          
          // Should succeed for all roles
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.id).toBe(venueId);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * **Validates: Requirement 6.9**
   * 
   * For any user attempting to read booking information, the action SHALL succeed 
   * if the user has any role (administrator, editor, or viewer) for that venue.
   */
  it('allows all roles to read booking information', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        async (role) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign the role to the user
          assignRole(userId, venueId, role);
          
          // Attempt to read booking information
          const result = attemptBookingRead(userId, venueId);
          
          // Should succeed for all roles
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * **Validates: Requirement 6.9**
   * 
   * For any user with the 'viewer' role attempting to modify venue data, 
   * the action SHALL be rejected.
   */
  it('prevents viewers from modifying venue data', async () => {
    await fc.assert(
      fc.asyncProperty(
        venueUpdateArbitrary,
        async (updates) => {
          // Create a venue and user with viewer role
          const venueId = createTestVenue();
          const userId = createTestUser();
          assignRole(userId, venueId, 'viewer');
          
          // Store original description
          const originalDescription = mockVenues.get(venueId)?.description;
          
          // Attempt to modify venue information
          const result = attemptVenueModification(userId, venueId, updates);
          
          // Should fail
          expect(result.success).toBe(false);
          expect(result.error).toMatch(/insufficient permissions/i);
          
          // Verify data was not modified
          const venue = mockVenues.get(venueId);
          expect(venue?.description).toBe(originalDescription);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * **Validates: Requirement 6.9**
   * 
   * For any user with the 'viewer' role attempting to modify experiences, 
   * the action SHALL be rejected.
   */
  it('prevents viewers from modifying experiences', async () => {
    await fc.assert(
      fc.asyncProperty(
        experienceUpdateArbitrary,
        async (updates) => {
          // Create a venue, experience, and user with viewer role
          const venueId = createTestVenue();
          const experienceId = createTestExperience(venueId);
          const userId = createTestUser();
          assignRole(userId, venueId, 'viewer');
          
          // Store original title
          const originalTitle = mockExperiences.get(experienceId)?.title;
          
          // Attempt to modify experience
          const result = attemptExperienceModification(userId, venueId, experienceId, updates);
          
          // Should fail
          expect(result.success).toBe(false);
          expect(result.error).toMatch(/insufficient permissions/i);
          
          // Verify data was not modified
          const experience = mockExperiences.get(experienceId);
          expect(experience?.title).toBe(originalTitle);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Validates that users without any role cannot perform any actions
   */
  it('denies all actions to users without a role', async () => {
    await fc.assert(
      fc.asyncProperty(
        venueUpdateArbitrary,
        async (updates) => {
          // Create a venue and user WITHOUT assigning a role
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Attempt various operations
          const deleteResult = attemptVenueDelete(userId, venueId);
          const modifyResult = attemptVenueModification(userId, venueId, updates);
          const readResult = attemptVenueRead(userId, venueId);
          
          // All should fail
          expect(deleteResult.success).toBe(false);
          expect(modifyResult.success).toBe(false);
          expect(readResult.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Validates that deactivated users cannot perform any actions
   */
  it('denies all actions to deactivated users', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        venueUpdateArbitrary,
        async (role, updates) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign role and then deactivate
          assignRole(userId, venueId, role);
          const key = `${venueId}-${userId}`;
          const venueUser = mockVenueUsers.get(key);
          if (venueUser) {
            venueUser.deactivated_at = new Date().toISOString();
          }
          
          // Attempt various operations
          const deleteResult = attemptVenueDelete(userId, venueId);
          const modifyResult = attemptVenueModification(userId, venueId, updates);
          const readResult = attemptVenueRead(userId, venueId);
          
          // All should fail
          expect(deleteResult.success).toBe(false);
          expect(modifyResult.success).toBe(false);
          expect(readResult.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Validates that permissions are venue-specific
   */
  it('enforces venue-specific permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        venueUpdateArbitrary,
        async (role, updates) => {
          // Create two venues and one user
          const venue1Id = createTestVenue();
          const venue2Id = createTestVenue();
          const userId = createTestUser();
          
          // Assign role only for venue1
          assignRole(userId, venue1Id, role);
          
          // Attempt to modify venue1 (should succeed based on role)
          const result1 = attemptVenueModification(userId, venue1Id, updates);
          
          // Attempt to modify venue2 (should fail - no role)
          const result2 = attemptVenueModification(userId, venue2Id, updates);
          
          // Verify venue1 access based on role
          if (role === 'administrator' || role === 'editor') {
            expect(result1.success).toBe(true);
          } else {
            expect(result1.success).toBe(false);
          }
          
          // Verify venue2 access is denied
          expect(result2.success).toBe(false);
          expect(result2.error).toMatch(/insufficient permissions/i);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

describe('Cross-Role Permission Validation', () => {
  /**
   * Validates the complete permission hierarchy across all roles
   */
  it('enforces correct permission hierarchy for all operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        async (role) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const experienceId = createTestExperience(venueId);
          const userId = createTestUser();
          
          // Assign the role
          assignRole(userId, venueId, role);
          
          // Test all permission types
          const permissions = {
            'venue.read': hasPermission(userId, venueId, 'venue.read'),
            'venue.write': hasPermission(userId, venueId, 'venue.write'),
            'venue.delete': hasPermission(userId, venueId, 'venue.delete'),
            'experience.read': hasPermission(userId, venueId, 'experience.read'),
            'experience.write': hasPermission(userId, venueId, 'experience.write'),
            'experience.delete': hasPermission(userId, venueId, 'experience.delete'),
            'booking.read': hasPermission(userId, venueId, 'booking.read'),
            'booking.write': hasPermission(userId, venueId, 'booking.write'),
            'employee.read': hasPermission(userId, venueId, 'employee.read'),
            'employee.write': hasPermission(userId, venueId, 'employee.write'),
            'employee.delete': hasPermission(userId, venueId, 'employee.delete'),
            'analytics.read': hasPermission(userId, venueId, 'analytics.read'),
            'financial.read': hasPermission(userId, venueId, 'financial.read'),
          };
          
          // Verify permissions match the role definition
          const expectedPermissions = ROLE_PERMISSIONS[role];
          
          for (const [permission, hasAccess] of Object.entries(permissions)) {
            const shouldHaveAccess = expectedPermissions.includes(permission);
            expect(hasAccess).toBe(shouldHaveAccess);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Validates that administrator role has all permissions
   */
  it('grants administrators all permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('administrator' as VenueRole),
        async (role) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign administrator role
          assignRole(userId, venueId, role);
          
          // Verify all permissions are granted
          const allPermissions = [
            'venue.read', 'venue.write', 'venue.delete',
            'experience.read', 'experience.write', 'experience.delete',
            'booking.read', 'booking.write',
            'employee.read', 'employee.write', 'employee.delete',
            'analytics.read', 'financial.read'
          ];
          
          for (const permission of allPermissions) {
            expect(hasPermission(userId, venueId, permission)).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Validates that editor role has appropriate permissions
   */
  it('grants editors appropriate permissions without delete or financial access', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('editor' as VenueRole),
        async (role) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign editor role
          assignRole(userId, venueId, role);
          
          // Verify editor has read/write but not delete or financial
          expect(hasPermission(userId, venueId, 'venue.read')).toBe(true);
          expect(hasPermission(userId, venueId, 'venue.write')).toBe(true);
          expect(hasPermission(userId, venueId, 'venue.delete')).toBe(false);
          expect(hasPermission(userId, venueId, 'experience.read')).toBe(true);
          expect(hasPermission(userId, venueId, 'experience.write')).toBe(true);
          expect(hasPermission(userId, venueId, 'experience.delete')).toBe(false);
          expect(hasPermission(userId, venueId, 'booking.read')).toBe(true);
          expect(hasPermission(userId, venueId, 'booking.write')).toBe(true);
          expect(hasPermission(userId, venueId, 'analytics.read')).toBe(true);
          expect(hasPermission(userId, venueId, 'financial.read')).toBe(false);
          expect(hasPermission(userId, venueId, 'employee.read')).toBe(false);
          expect(hasPermission(userId, venueId, 'employee.write')).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Validates that viewer role has only read permissions
   */
  it('grants viewers only read permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('viewer' as VenueRole),
        async (role) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign viewer role
          assignRole(userId, venueId, role);
          
          // Verify viewer has only read permissions
          expect(hasPermission(userId, venueId, 'venue.read')).toBe(true);
          expect(hasPermission(userId, venueId, 'venue.write')).toBe(false);
          expect(hasPermission(userId, venueId, 'venue.delete')).toBe(false);
          expect(hasPermission(userId, venueId, 'experience.read')).toBe(true);
          expect(hasPermission(userId, venueId, 'experience.write')).toBe(false);
          expect(hasPermission(userId, venueId, 'experience.delete')).toBe(false);
          expect(hasPermission(userId, venueId, 'booking.read')).toBe(true);
          expect(hasPermission(userId, venueId, 'booking.write')).toBe(false);
          expect(hasPermission(userId, venueId, 'analytics.read')).toBe(true);
          expect(hasPermission(userId, venueId, 'financial.read')).toBe(false);
          expect(hasPermission(userId, venueId, 'employee.read')).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * Validates permission consistency across multiple operations
   */
  it('maintains consistent permissions across multiple operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        roleArbitrary,
        fc.array(venueUpdateArbitrary, { minLength: 2, maxLength: 5 }),
        async (role, updatesList) => {
          // Create a venue and user
          const venueId = createTestVenue();
          const userId = createTestUser();
          
          // Assign the role
          assignRole(userId, venueId, role);
          
          // Attempt multiple modifications
          const results = updatesList.map(updates => 
            attemptVenueModification(userId, venueId, updates)
          );
          
          // All results should be consistent with the role
          const expectedSuccess = role === 'administrator' || role === 'editor';
          
          for (const result of results) {
            expect(result.success).toBe(expectedSuccess);
            if (!expectedSuccess) {
              expect(result.error).toMatch(/insufficient permissions/i);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});
