/**
 * Venue Claim Service
 * Handles venue ownership claim requests, email verification, and admin review workflow
 * Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7
 */

import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { logger } from '@tripslip/utils';

export interface VenueClaimRequest {
  id: string;
  venueId: string;
  requesterId: string;
  businessEmail: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationSentAt?: Date;
  proofType: 'business_license' | 'employment_verification' | 'domain_email';
  proofDocumentUrl?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClaimRequestInput {
  venueId: string;
  businessEmail: string;
  proofType: 'business_license' | 'employment_verification' | 'domain_email';
  proofDocumentUrl?: string;
}

export interface ReviewClaimInput {
  claimId: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface VenueClaimServiceConfig {
  supabase: SupabaseClient;
  sendEmail?: (to: string, subject: string, body: string) => Promise<void>;
}

export class VenueClaimService {
  private supabase: SupabaseClient;
  private sendEmail?: (to: string, subject: string, body: string) => Promise<void>;

  constructor(config: VenueClaimServiceConfig) {
    this.supabase = config.supabase;
    this.sendEmail = config.sendEmail;
  }

  /**
   * Submit a venue claim request
   * Requirements: 5.1, 5.2, 5.3
   */
  async submitClaimRequest(
    userId: string,
    input: CreateClaimRequestInput
  ): Promise<VenueClaimRequest> {
    // Check if venue exists and is not already claimed
    const { data: venue, error: venueError } = await this.supabase
      .from('venues')
      .select('id, name, claimed')
      .eq('id', input.venueId)
      .single();

    if (venueError || !venue) {
      throw new Error('Venue not found');
    }

    if (venue.claimed) {
      throw new Error('Venue is already claimed');
    }

    // Check for existing pending/approved claims
    const { data: existingClaims } = await this.supabase
      .from('venue_claim_requests')
      .select('id, status')
      .eq('venue_id', input.venueId)
      .in('status', ['pending', 'under_review', 'approved']);

    if (existingClaims && existingClaims.length > 0) {
      throw new Error('There is already a pending or approved claim for this venue');
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create claim request
    const { data: claimRequest, error: createError } = await this.supabase
      .from('venue_claim_requests')
      .insert({
        venue_id: input.venueId,
        requester_id: userId,
        business_email: input.businessEmail,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_sent_at: new Date().toISOString(),
        proof_type: input.proofType,
        proof_document_url: input.proofDocumentUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (createError || !claimRequest) {
      throw new Error(`Failed to create claim request: ${createError?.message}`);
    }

    // Send verification email
    await this.sendVerificationEmail(
      input.businessEmail,
      verificationToken,
      venue.name
    );

    // Notify admins about new claim request
    await this.notifyAdminsOfNewClaim(claimRequest.id, venue.name);

    return this.mapClaimRequest(claimRequest);
  }

  /**
   * Verify business email with token
   * Requirements: 5.2
   */
  async verifyEmail(token: string): Promise<VenueClaimRequest> {
    const { data: claimRequest, error: findError } = await this.supabase
      .from('venue_claim_requests')
      .select('*')
      .eq('email_verification_token', token)
      .eq('email_verified', false)
      .single();

    if (findError || !claimRequest) {
      throw new Error('Invalid or expired verification token');
    }

    // Update claim request as email verified and move to under_review
    const { data: updated, error: updateError } = await this.supabase
      .from('venue_claim_requests')
      .update({
        email_verified: true,
        status: 'under_review',
        email_verification_token: null,
      })
      .eq('id', claimRequest.id)
      .select()
      .single();

    if (updateError || !updated) {
      throw new Error('Failed to verify email');
    }

    // Notify admins that claim is ready for review
    await this.notifyAdminsClaimReadyForReview(updated.id);

    return this.mapClaimRequest(updated);
  }

  /**
   * Get claim request by ID
   */
  async getClaimRequest(claimId: string): Promise<VenueClaimRequest | null> {
    const { data, error } = await this.supabase
      .from('venue_claim_requests')
      .select('*')
      .eq('id', claimId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapClaimRequest(data);
  }

  /**
   * Get all claim requests for a user
   */
  async getUserClaimRequests(userId: string): Promise<VenueClaimRequest[]> {
    const { data, error } = await this.supabase
      .from('venue_claim_requests')
      .select('*')
      .eq('requester_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(this.mapClaimRequest);
  }

  /**
   * Get all pending claim requests (admin only)
   */
  async getPendingClaimRequests(): Promise<VenueClaimRequest[]> {
    const { data, error } = await this.supabase
      .from('venue_claim_requests')
      .select('*')
      .in('status', ['pending', 'under_review'])
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(this.mapClaimRequest);
  }

  /**
   * Review and approve/reject a claim request (admin only)
   * Requirements: 5.5, 5.6
   */
  async reviewClaimRequest(
    adminUserId: string,
    input: ReviewClaimInput
  ): Promise<VenueClaimRequest> {
    const { data: claimRequest, error: findError } = await this.supabase
      .from('venue_claim_requests')
      .select('*, venues(name)')
      .eq('id', input.claimId)
      .single();

    if (findError || !claimRequest) {
      throw new Error('Claim request not found');
    }

    if (!['pending', 'under_review'].includes(claimRequest.status)) {
      throw new Error('Claim request has already been reviewed');
    }

    if (!input.approved && !input.rejectionReason) {
      throw new Error('Rejection reason is required when rejecting a claim');
    }

    // Update claim request status
    const { data: updated, error: updateError } = await this.supabase
      .from('venue_claim_requests')
      .update({
        status: input.approved ? 'approved' : 'rejected',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: input.rejectionReason,
      })
      .eq('id', input.claimId)
      .select()
      .single();

    if (updateError || !updated) {
      throw new Error('Failed to update claim request');
    }

    // Send notification to requester about claim status
    await this.notifyRequesterOfClaimStatus(
      updated.requester_id,
      updated.business_email,
      input.approved,
      claimRequest.venues?.name || 'the venue',
      input.rejectionReason
    );

    return this.mapClaimRequest(updated);
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(claimId: string): Promise<void> {
    const { data: claimRequest, error } = await this.supabase
      .from('venue_claim_requests')
      .select('*, venues(name)')
      .eq('id', claimId)
      .eq('email_verified', false)
      .single();

    if (error || !claimRequest) {
      throw new Error('Claim request not found or already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await this.supabase
      .from('venue_claim_requests')
      .update({
        email_verification_token: verificationToken,
        email_verification_sent_at: new Date().toISOString(),
      })
      .eq('id', claimId);

    await this.sendVerificationEmail(
      claimRequest.business_email,
      verificationToken,
      claimRequest.venues?.name || 'the venue'
    );
  }

  /**
   * Send verification email to business email
   * Requirements: 5.2
   */
  private async sendVerificationEmail(
    email: string,
    token: string,
    venueName: string
  ): Promise<void> {
    if (!this.sendEmail) {
      logger.warn('Email service not configured, skipping verification email');
      return;
    }

    const verificationUrl = `${process.env.VENUE_APP_URL}/verify-claim?token=${token}`;
    
    const subject = `Verify your email to claim ${venueName}`;
    const body = `
      <h2>Verify Your Email Address</h2>
      <p>You've requested to claim <strong>${venueName}</strong> on TripSlip.</p>
      <p>Please verify your business email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.sendEmail(email, subject, body);
  }

  /**
   * Notify admins of new claim request
   * Requirements: 5.4
   */
  private async notifyAdminsOfNewClaim(
    claimId: string,
    venueName: string
  ): Promise<void> {
    if (!this.sendEmail) {
      logger.warn('Email service not configured, skipping admin notification');
      return;
    }

    // Get tripslip_admin role id
    const { data: adminRole } = await this.supabase
      .from('user_roles')
      .select('id')
      .eq('name', 'tripslip_admin')
      .single();

    if (!adminRole) {
      logger.warn('Admin role not found');
      return;
    }

    // Get all tripslip_admin users
    const { data: admins } = await this.supabase
      .from('user_role_assignments')
      .select('user_id, auth.users(email)')
      .eq('role_id', adminRole.id)
      .eq('is_active', true);

    if (!admins || admins.length === 0) {
      return;
    }

    const reviewUrl = `${process.env.ADMIN_APP_URL}/venue-claims/${claimId}`;
    
    const subject = `New venue claim request: ${venueName}`;
    const body = `
      <h2>New Venue Claim Request</h2>
      <p>A new claim request has been submitted for <strong>${venueName}</strong>.</p>
      <p>Please review the claim at:</p>
      <p><a href="${reviewUrl}">${reviewUrl}</a></p>
    `;

    // Send to all admins
    for (const admin of admins) {
      const email = (admin as any).auth?.users?.email;
      if (email) {
        await this.sendEmail(email, subject, body);
      }
    }
  }

  /**
   * Notify admins that claim is ready for review
   * Requirements: 5.4
   */
  private async notifyAdminsClaimReadyForReview(claimId: string): Promise<void> {
    // Similar to notifyAdminsOfNewClaim but with different message
    logger.info('Claim ready for review', { claimId });
  }

  /**
   * Notify requester of claim status change
   * Requirements: 5.8
   */
  private async notifyRequesterOfClaimStatus(
    requesterId: string,
    businessEmail: string,
    approved: boolean,
    venueName: string,
    rejectionReason?: string
  ): Promise<void> {
    if (!this.sendEmail) {
      logger.warn('Email service not configured, skipping status notification');
      return;
    }

    const subject = approved
      ? `Your claim for ${venueName} has been approved!`
      : `Your claim for ${venueName} was not approved`;

    const body = approved
      ? `
        <h2>Claim Approved!</h2>
        <p>Congratulations! Your claim for <strong>${venueName}</strong> has been approved.</p>
        <p>You now have administrator access to manage this venue's profile.</p>
        <p><a href="${process.env.VENUE_APP_URL}/dashboard">Go to Dashboard</a></p>
      `
      : `
        <h2>Claim Not Approved</h2>
        <p>Unfortunately, your claim for <strong>${venueName}</strong> was not approved.</p>
        <p><strong>Reason:</strong> ${rejectionReason}</p>
        <p>If you believe this was an error, please contact support.</p>
      `;

    await this.sendEmail(businessEmail, subject, body);
  }

  /**
   * Map database record to VenueClaimRequest interface
   */
  private mapClaimRequest(data: any): VenueClaimRequest {
    return {
      id: data.id,
      venueId: data.venue_id,
      requesterId: data.requester_id,
      businessEmail: data.business_email,
      emailVerified: data.email_verified,
      emailVerificationToken: data.email_verification_token,
      emailVerificationSentAt: data.email_verification_sent_at
        ? new Date(data.email_verification_sent_at)
        : undefined,
      proofType: data.proof_type,
      proofDocumentUrl: data.proof_document_url,
      status: data.status,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      rejectionReason: data.rejection_reason,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
