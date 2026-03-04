/**
 * Unit tests for Venue Claim Service
 * Tests venue claiming workflow including email verification and admin review
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VenueClaimService } from '../venue-claim-service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

// Mock email sender
const mockSendEmail = vi.fn();

describe('VenueClaimService', () => {
  let service: VenueClaimService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VenueClaimService({
      supabase: mockSupabase as any,
      sendEmail: mockSendEmail,
    });
  });

  describe('submitClaimRequest', () => {
    it('should create a claim request for an unclaimed venue', async () => {
      const userId = 'user-123';
      const venueId = 'venue-456';
      const input = {
        venueId,
        businessEmail: 'owner@museum.com',
        proofType: 'domain_email' as const,
      };

      // Mock venue lookup
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: venueId, name: 'Test Museum', claimed: false },
          error: null,
        }),
      });

      // Mock existing claims check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      // Mock claim request creation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'claim-789',
            venue_id: venueId,
            requester_id: userId,
            business_email: input.businessEmail,
            email_verified: false,
            proof_type: input.proofType,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Mock admin role lookup for notifications
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'role-admin-id' },
          error: null,
        }),
      });

      // Mock admin users lookup
      const eqMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({ eq: eqMock }),
      });

      const result = await service.submitClaimRequest(userId, input);

      expect(result).toBeDefined();
      expect(result.venueId).toBe(venueId);
      expect(result.businessEmail).toBe(input.businessEmail);
      expect(result.status).toBe('pending');
      expect(result.emailVerified).toBe(false);
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should reject claim for already claimed venue', async () => {
      const userId = 'user-123';
      const venueId = 'venue-456';
      const input = {
        venueId,
        businessEmail: 'owner@museum.com',
        proofType: 'domain_email' as const,
      };

      // Mock venue lookup - venue is claimed
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: venueId, name: 'Test Museum', claimed: true },
          error: null,
        }),
      });

      await expect(
        service.submitClaimRequest(userId, input)
      ).rejects.toThrow('Venue is already claimed');
    });

    it('should reject claim if there is a pending claim', async () => {
      const userId = 'user-123';
      const venueId = 'venue-456';
      const input = {
        venueId,
        businessEmail: 'owner@museum.com',
        proofType: 'domain_email' as const,
      };

      // Mock venue lookup
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: venueId, name: 'Test Museum', claimed: false },
          error: null,
        }),
      });

      // Mock existing claims check - has pending claim
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: 'claim-existing', status: 'pending' }],
          error: null,
        }),
      });

      await expect(
        service.submitClaimRequest(userId, input)
      ).rejects.toThrow('There is already a pending or approved claim for this venue');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and move claim to under_review', async () => {
      const token = 'verification-token-123';
      const claimId = 'claim-789';

      // Mock finding claim by token
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: claimId,
            venue_id: 'venue-456',
            requester_id: 'user-123',
            business_email: 'owner@museum.com',
            email_verified: false,
            email_verification_token: token,
            status: 'pending',
          },
          error: null,
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: claimId,
            venue_id: 'venue-456',
            requester_id: 'user-123',
            business_email: 'owner@museum.com',
            email_verified: true,
            status: 'under_review',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      const result = await service.verifyEmail(token);

      expect(result).toBeDefined();
      expect(result.emailVerified).toBe(true);
      expect(result.status).toBe('under_review');
    });

    it('should reject invalid verification token', async () => {
      const token = 'invalid-token';

      // Mock finding claim by token - not found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      });

      await expect(service.verifyEmail(token)).rejects.toThrow(
        'Invalid or expired verification token'
      );
    });
  });

  describe('reviewClaimRequest', () => {
    it('should approve claim and grant administrator access', async () => {
      const adminUserId = 'admin-123';
      const claimId = 'claim-789';
      const input = {
        claimId,
        approved: true,
      };

      // Mock finding claim
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: claimId,
            venue_id: 'venue-456',
            requester_id: 'user-123',
            business_email: 'owner@museum.com',
            status: 'under_review',
            venues: { name: 'Test Museum' },
          },
          error: null,
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: claimId,
            venue_id: 'venue-456',
            requester_id: 'user-123',
            business_email: 'owner@museum.com',
            status: 'approved',
            reviewed_by: adminUserId,
            reviewed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      const result = await service.reviewClaimRequest(adminUserId, input);

      expect(result).toBeDefined();
      expect(result.status).toBe('approved');
      expect(result.reviewedBy).toBe(adminUserId);
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should reject claim with reason', async () => {
      const adminUserId = 'admin-123';
      const claimId = 'claim-789';
      const input = {
        claimId,
        approved: false,
        rejectionReason: 'Insufficient proof of venue ownership',
      };

      // Mock finding claim
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: claimId,
            venue_id: 'venue-456',
            requester_id: 'user-123',
            business_email: 'owner@museum.com',
            status: 'under_review',
            venues: { name: 'Test Museum' },
          },
          error: null,
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: claimId,
            venue_id: 'venue-456',
            requester_id: 'user-123',
            business_email: 'owner@museum.com',
            status: 'rejected',
            reviewed_by: adminUserId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: input.rejectionReason,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      const result = await service.reviewClaimRequest(adminUserId, input);

      expect(result).toBeDefined();
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe(input.rejectionReason);
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should require rejection reason when rejecting', async () => {
      const adminUserId = 'admin-123';
      const claimId = 'claim-789';
      const input = {
        claimId,
        approved: false,
        // Missing rejectionReason
      };

      // Mock finding claim
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: claimId,
            venue_id: 'venue-456',
            requester_id: 'user-123',
            business_email: 'owner@museum.com',
            status: 'under_review',
            venues: { name: 'Test Museum' },
          },
          error: null,
        }),
      });

      await expect(
        service.reviewClaimRequest(adminUserId, input)
      ).rejects.toThrow('Rejection reason is required when rejecting a claim');
    });

    it('should not allow reviewing already reviewed claims', async () => {
      const adminUserId = 'admin-123';
      const claimId = 'claim-789';
      const input = {
        claimId,
        approved: true,
      };

      // Mock finding claim - already approved
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: claimId,
            venue_id: 'venue-456',
            requester_id: 'user-123',
            business_email: 'owner@museum.com',
            status: 'approved',
            venues: { name: 'Test Museum' },
          },
          error: null,
        }),
      });

      await expect(
        service.reviewClaimRequest(adminUserId, input)
      ).rejects.toThrow('Claim request has already been reviewed');
    });
  });

  describe('getUserClaimRequests', () => {
    it('should return all claim requests for a user', async () => {
      const userId = 'user-123';

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'claim-1',
              venue_id: 'venue-1',
              requester_id: userId,
              business_email: 'owner@museum.com',
              status: 'approved',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'claim-2',
              venue_id: 'venue-2',
              requester_id: userId,
              business_email: 'owner@museum.com',
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      });

      const result = await service.getUserClaimRequests(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('claim-1');
      expect(result[1].id).toBe('claim-2');
    });
  });

  describe('getPendingClaimRequests', () => {
    it('should return all pending and under_review claims', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'claim-1',
              venue_id: 'venue-1',
              requester_id: 'user-1',
              business_email: 'owner1@museum.com',
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'claim-2',
              venue_id: 'venue-2',
              requester_id: 'user-2',
              business_email: 'owner2@museum.com',
              status: 'under_review',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      });

      const result = await service.getPendingClaimRequests();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('under_review');
    });
  });
});
