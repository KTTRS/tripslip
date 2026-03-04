/**
 * Property-Based Tests - Venue Claiming Workflow (Task 3.4)
 * 
 * Tests two core properties:
 * - Property 10: Claim Duplicate Prevention
 * - Property 11: Claim Approval Access Grant
 * 
 * **Validates: Requirements 5.6, 5.7**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// =====================================================
// TEST SETUP
// =====================================================

// Note: These tests validate the business logic and database constraints
// They use mock data structures to test the properties without requiring
// a live database connection. Integration tests with real database
// connections should be run separately in a test environment.

let mockVenues: Map<string, any>;
let mockUsers: Map<string, any>;
let mockClaims: Map<string, any>;
let mockVenueUsers: Map<string, any>;

beforeEach(async () => {
  // Initialize mock data stores
  mockVenues = new Map();
  mockUsers = new Map();
  mockClaims = new Map();
  mockVenueUsers = new Map();
});

afterEach(async () => {
  // Clear mock data
  mockVenues.clear();
  mockUsers.clear();
  mockClaims.clear();
  mockVenueUsers.clear();
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Simulates creating a test venue
 */
function createTestVenue(claimed: boolean = false): string {
  const venueId = `venue-${Date.now()}-${Math.random()}`;
  mockVenues.set(venueId, {
    id: venueId,
    name: `Test Venue ${venueId}`,
    claimed: claimed,
    claimed_at: claimed ? new Date().toISOString() : null,
    claimed_by: null,
  });
  return venueId;
}

/**
 * Simulates creating a test user
 */
function createTestUser(): string {
  const userId = `user-${Date.now()}-${Math.random()}`;
  mockUsers.set(userId, {
    id: userId,
    email: `test-${userId}@example.com`,
  });
  return userId;
}

/**
 * Simulates creating a claim request
 */
function createClaimRequest(
  venueId: string,
  userId: string,
  status: 'pending' | 'under_review' | 'approved' | 'rejected' = 'pending'
): string {
  const claimId = `claim-${Date.now()}-${Math.random()}`;
  mockClaims.set(claimId, {
    id: claimId,
    venue_id: venueId,
    requester_id: userId,
    status: status,
    email_verified: status !== 'pending',
  });
  return claimId;
}

/**
 * Simulates checking if a venue can accept a new claim
 * This implements the business logic from Requirement 5.7
 */
function canSubmitClaim(venueId: string): { allowed: boolean; reason?: string } {
  const venue = mockVenues.get(venueId);
  
  if (!venue) {
    return { allowed: false, reason: 'Venue not found' };
  }
  
  // Check if venue is already claimed (Requirement 5.7)
  if (venue.claimed) {
    return { allowed: false, reason: 'Venue is already claimed' };
  }
  
  // Check for existing pending/approved claims
  for (const [_, claim] of mockClaims) {
    if (claim.venue_id === venueId && 
        ['pending', 'under_review', 'approved'].includes(claim.status)) {
      return { allowed: false, reason: 'There is already a pending or approved claim for this venue' };
    }
  }
  
  return { allowed: true };
}

/**
 * Simulates approving a claim
 * This implements the business logic from Requirement 5.6
 */
function approveClaim(claimId: string, adminUserId: string): void {
  const claim = mockClaims.get(claimId);
  
  if (!claim) {
    throw new Error('Claim not found');
  }
  
  if (!['pending', 'under_review'].includes(claim.status)) {
    throw new Error('Claim has already been reviewed');
  }
  
  // Update claim status
  claim.status = 'approved';
  claim.reviewed_by = adminUserId;
  claim.reviewed_at = new Date().toISOString();
  
  // Update venue as claimed
  const venue = mockVenues.get(claim.venue_id);
  if (venue) {
    venue.claimed = true;
    venue.claimed_at = new Date().toISOString();
    venue.claimed_by = claim.requester_id;
  }
  
  // Grant administrator role (Requirement 5.6)
  const venueUserKey = `${claim.venue_id}-${claim.requester_id}`;
  mockVenueUsers.set(venueUserKey, {
    venue_id: claim.venue_id,
    user_id: claim.requester_id,
    role: 'administrator',
  });
}

/**
 * Simulates rejecting a claim
 */
function rejectClaim(claimId: string, adminUserId: string, reason: string): void {
  const claim = mockClaims.get(claimId);
  
  if (!claim) {
    throw new Error('Claim not found');
  }
  
  if (!['pending', 'under_review'].includes(claim.status)) {
    throw new Error('Claim has already been reviewed');
  }
  
  if (!reason) {
    throw new Error('Rejection reason is required');
  }
  
  // Update claim status
  claim.status = 'rejected';
  claim.reviewed_by = adminUserId;
  claim.reviewed_at = new Date().toISOString();
  claim.rejection_reason = reason;
  
  // Venue remains unclaimed
}

/**
 * Check if a venue is marked as claimed
 */
function isVenueClaimed(venueId: string): boolean {
  const venue = mockVenues.get(venueId);
  return venue ? venue.claimed : false;
}

/**
 * Check if a user has administrator role for a venue
 */
function hasAdministratorRole(userId: string, venueId: string): boolean {
  const venueUserKey = `${venueId}-${userId}`;
  const venueUser = mockVenueUsers.get(venueUserKey);
  return venueUser ? venueUser.role === 'administrator' : false;
}

// =====================================================
// CUSTOM ARBITRARIES
// =====================================================

/**
 * Generate valid claim request input
 */
const validClaimRequestArbitrary = fc.record({
  businessEmail: fc.emailAddress(),
  proofType: fc.constantFrom('business_license', 'employment_verification', 'domain_email') as fc.Arbitrary<'business_license' | 'employment_verification' | 'domain_email'>,
  proofDocumentUrl: fc.option(fc.webUrl(), { nil: undefined }),
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Property 10: Claim Duplicate Prevention (Task 3.4)', () => {
  /**
   * **Validates: Requirement 5.7**
   * 
   * For any venue that is already claimed (claimed = true), attempting to submit 
   * a new claim request for that venue SHALL be rejected.
   */
  it('rejects claim requests for venues that are already claimed', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        async (claimInput) => {
          // Create a venue that is already claimed
          const venueId = createTestVenue(true);
          const userId = createTestUser();

          // Attempt to submit a claim request for the already-claimed venue
          const result = canSubmitClaim(venueId);

          // Should be rejected
          expect(result.allowed).toBe(false);
          expect(result.reason).toMatch(/already claimed/i);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('rejects claim requests when there is already a pending claim', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        validClaimRequestArbitrary,
        async (claimInput1, claimInput2) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const user1Id = createTestUser();
          const user2Id = createTestUser();

          // Create a pending claim request from user1
          createClaimRequest(venueId, user1Id, 'pending');

          // Attempt to submit another claim request from user2
          const result = canSubmitClaim(venueId);

          // Should be rejected due to existing pending claim
          expect(result.allowed).toBe(false);
          expect(result.reason).toMatch(/pending or approved claim/i);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('rejects claim requests when there is already an under_review claim', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        validClaimRequestArbitrary,
        async (claimInput1, claimInput2) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const user1Id = createTestUser();
          const user2Id = createTestUser();

          // Create an under_review claim request from user1
          createClaimRequest(venueId, user1Id, 'under_review');

          // Attempt to submit another claim request from user2
          const result = canSubmitClaim(venueId);

          // Should be rejected
          expect(result.allowed).toBe(false);
          expect(result.reason).toMatch(/pending or approved claim/i);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('rejects claim requests when there is already an approved claim', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        validClaimRequestArbitrary,
        async (claimInput1, claimInput2) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const user1Id = createTestUser();
          const user2Id = createTestUser();

          // Create an approved claim request from user1
          createClaimRequest(venueId, user1Id, 'approved');

          // Attempt to submit another claim request from user2
          const result = canSubmitClaim(venueId);

          // Should be rejected due to existing approved claim
          expect(result.allowed).toBe(false);
          expect(result.reason).toMatch(/pending or approved claim/i);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('allows claim requests for venues with only rejected claims', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        validClaimRequestArbitrary,
        async (claimInput1, claimInput2) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const user1Id = createTestUser();
          const user2Id = createTestUser();

          // Create a rejected claim request from user1
          createClaimRequest(venueId, user1Id, 'rejected');

          // Attempt to submit a new claim request from user2
          const result = canSubmitClaim(venueId);

          // Should succeed because rejected claims don't block new claims
          expect(result.allowed).toBe(true);
          expect(result.reason).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('consistently prevents duplicate claims across multiple attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (attemptCount) => {
          // Create a venue that is already claimed
          const venueId = createTestVenue(true);

          // Try to submit multiple claims
          const results = [];
          for (let i = 0; i < attemptCount; i++) {
            const userId = createTestUser();
            const result = canSubmitClaim(venueId);
            results.push(result);
          }

          // All attempts should be rejected
          expect(results.every(r => !r.allowed)).toBe(true);
          expect(results.every(r => r.reason?.match(/already claimed/i))).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

describe('Property 11: Claim Approval Access Grant (Task 3.4)', () => {
  /**
   * **Validates: Requirement 5.6**
   * 
   * For any approved venue claim request, the requester SHALL be granted 
   * the 'administrator' role for that venue.
   */
  it('grants administrator role when claim is approved', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        async (claimInput) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const userId = createTestUser();
          const adminUserId = createTestUser();

          // Create a claim request in under_review status
          const claimId = createClaimRequest(venueId, userId, 'under_review');

          // Approve the claim
          approveClaim(claimId, adminUserId);

          // Verify the venue is now marked as claimed
          expect(isVenueClaimed(venueId)).toBe(true);

          // Verify the requester has administrator role
          expect(hasAdministratorRole(userId, venueId)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('updates venue claimed status when claim is approved', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        async (claimInput) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const userId = createTestUser();
          const adminUserId = createTestUser();

          // Verify venue starts as unclaimed
          expect(isVenueClaimed(venueId)).toBe(false);

          // Create and approve a claim request
          const claimId = createClaimRequest(venueId, userId, 'under_review');
          approveClaim(claimId, adminUserId);

          // Verify venue is now claimed
          expect(isVenueClaimed(venueId)).toBe(true);

          // Verify claimed_at timestamp is set
          const venue = mockVenues.get(venueId);
          expect(venue?.claimed_at).toBeDefined();
          expect(venue?.claimed_by).toBe(userId);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('does not grant administrator role when claim is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        fc.string({ minLength: 10, maxLength: 200 }),
        async (claimInput, rejectionReason) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const userId = createTestUser();
          const adminUserId = createTestUser();

          // Create a claim request
          const claimId = createClaimRequest(venueId, userId, 'under_review');

          // Reject the claim
          rejectClaim(claimId, adminUserId, rejectionReason);

          // Verify the claim was rejected
          const claim = mockClaims.get(claimId);
          expect(claim?.status).toBe('rejected');
          expect(claim?.rejection_reason).toBe(rejectionReason);

          // Verify the venue is still unclaimed
          expect(isVenueClaimed(venueId)).toBe(false);

          // Verify the requester does NOT have administrator role
          expect(hasAdministratorRole(userId, venueId)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('grants exactly one administrator role per approved claim', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        async (claimInput) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const userId = createTestUser();
          const adminUserId = createTestUser();

          // Create and approve a claim
          const claimId = createClaimRequest(venueId, userId, 'under_review');
          approveClaim(claimId, adminUserId);

          // Verify there's exactly one venue_users entry
          const venueUserKey = `${venueId}-${userId}`;
          const venueUser = mockVenueUsers.get(venueUserKey);
          
          expect(venueUser).toBeDefined();
          expect(venueUser?.role).toBe('administrator');
          expect(venueUser?.venue_id).toBe(venueId);
          expect(venueUser?.user_id).toBe(userId);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('prevents re-approval of already reviewed claims', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        async (claimInput) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const userId = createTestUser();
          const adminUserId = createTestUser();

          // Create and approve a claim
          const claimId = createClaimRequest(venueId, userId, 'under_review');
          approveClaim(claimId, adminUserId);

          // Try to approve again (should fail)
          expect(() => {
            approveClaim(claimId, adminUserId);
          }).toThrow(/already been reviewed/i);

          // Verify the venue is still claimed (no duplicate state)
          expect(isVenueClaimed(venueId)).toBe(true);

          // Verify the requester still has administrator role (no duplicates)
          expect(hasAdministratorRole(userId, venueId)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

describe('Cross-Property Validation: Claim Workflow Integrity', () => {
  it('ensures approved claims prevent new claims (Properties 10 & 11 combined)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        validClaimRequestArbitrary,
        async (claimInput1, claimInput2) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const user1Id = createTestUser();
          const user2Id = createTestUser();
          const adminUserId = createTestUser();

          // User 1 submits and gets approved
          const claim1Id = createClaimRequest(venueId, user1Id, 'under_review');
          approveClaim(claim1Id, adminUserId);

          // Verify user 1 has administrator role (Property 11)
          expect(hasAdministratorRole(user1Id, venueId)).toBe(true);

          // User 2 attempts to claim the same venue (Property 10)
          const result = canSubmitClaim(venueId);

          // Should be rejected
          expect(result.allowed).toBe(false);
          expect(result.reason).toMatch(/already claimed|pending or approved claim/i);

          // Verify user 2 does NOT have administrator role
          expect(hasAdministratorRole(user2Id, venueId)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('ensures claim workflow state transitions are valid', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClaimRequestArbitrary,
        async (claimInput) => {
          // Create an unclaimed venue
          const venueId = createTestVenue(false);
          const userId = createTestUser();
          const adminUserId = createTestUser();

          // Create claim (starts as 'pending')
          const claimId = createClaimRequest(venueId, userId, 'pending');
          let claim = mockClaims.get(claimId);
          
          expect(claim?.status).toBe('pending');
          expect(claim?.email_verified).toBe(false);

          // Move to under_review (simulating email verification)
          claim.status = 'under_review';
          claim.email_verified = true;
          expect(claim.status).toBe('under_review');
          expect(claim.email_verified).toBe(true);

          // Approve claim (should move to 'approved')
          approveClaim(claimId, adminUserId);
          claim = mockClaims.get(claimId);

          expect(claim?.status).toBe('approved');
          expect(claim?.reviewed_by).toBe(adminUserId);
          expect(claim?.reviewed_at).toBeDefined();

          // Verify final state
          expect(isVenueClaimed(venueId)).toBe(true);
          expect(hasAdministratorRole(userId, venueId)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('maintains data consistency across multiple claim operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validClaimRequestArbitrary, { minLength: 2, maxLength: 5 }),
        async (claimInputs) => {
          // Create multiple venues
          const venues = claimInputs.map(() => createTestVenue(false));
          const users = claimInputs.map(() => createTestUser());
          const adminUserId = createTestUser();

          // Submit and approve claims for each venue
          for (let i = 0; i < venues.length; i++) {
            const venueId = venues[i];
            const userId = users[i];

            // Create and approve claim
            const claimId = createClaimRequest(venueId, userId, 'under_review');
            approveClaim(claimId, adminUserId);

            // Verify each venue is claimed by the correct user
            expect(isVenueClaimed(venueId)).toBe(true);
            expect(hasAdministratorRole(userId, venueId)).toBe(true);

            // Verify no cross-contamination (user doesn't have access to other venues)
            for (let j = 0; j < venues.length; j++) {
              if (i !== j) {
                expect(hasAdministratorRole(userId, venues[j])).toBe(false);
              }
            }
          }

          // Verify all venues are claimed
          expect(venues.every(v => isVenueClaimed(v))).toBe(true);

          // Verify each user has exactly one administrator role
          for (let i = 0; i < users.length; i++) {
            const userId = users[i];
            let adminCount = 0;
            
            for (const [_, venueUser] of mockVenueUsers) {
              if (venueUser.user_id === userId && venueUser.role === 'administrator') {
                adminCount++;
              }
            }
            
            expect(adminCount).toBe(1);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});
