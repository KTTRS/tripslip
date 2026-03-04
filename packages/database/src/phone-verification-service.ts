/**
 * Phone Verification Service
 * 
 * Handles phone number verification for SMS opt-in.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { validatePhoneNumber, formatPhoneNumberE164 } from '@tripslip/utils';

export interface PhoneVerificationRequest {
  phoneNumber: string;
  userId: string;
}

export interface PhoneVerificationConfirm {
  phoneNumber: string;
  verificationCode: string;
  userId: string;
}

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
  expiresAt?: string;
  attemptsRemaining?: number;
}

/**
 * Phone Verification Service
 */
export class PhoneVerificationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Send verification code to phone number
   */
  async sendVerificationCode(request: PhoneVerificationRequest): Promise<PhoneVerificationResult> {
    const { phoneNumber, userId } = request;

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        message: 'Invalid phone number format',
      };
    }

    // Format phone number to E.164
    const formattedPhone = formatPhoneNumberE164(phoneNumber);
    if (!formattedPhone) {
      return {
        success: false,
        message: 'Unable to format phone number',
      };
    }

    // Check rate limiting (max 3 requests per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentRequests, error: rateLimitError } = await this.supabase
      .from('phone_verifications')
      .select('id')
      .eq('user_id', userId)
      .eq('phone_number', formattedPhone)
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      return {
        success: false,
        message: 'Database error checking rate limit',
      };
    }

    if (recentRequests && recentRequests.length >= 3) {
      return {
        success: false,
        message: 'Too many verification requests. Please wait an hour before trying again.',
      };
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification code
    const { error: insertError } = await this.supabase
      .from('phone_verifications')
      .insert({
        user_id: userId,
        phone_number: formattedPhone,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      return {
        success: false,
        message: 'Failed to create verification request',
      };
    }

    // Send SMS via Edge Function
    try {
      const { error: smsError } = await this.supabase.functions.invoke('send-sms', {
        body: {
          to: formattedPhone,
          message: `Your TripSlip verification code is: ${verificationCode}. This code expires in 15 minutes.`,
          type: 'verification',
        },
      });

      if (smsError) {
        console.error('SMS send error:', smsError);
        return {
          success: false,
          message: 'Failed to send verification code',
        };
      }

      return {
        success: true,
        message: 'Verification code sent successfully',
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        message: 'Failed to send verification code',
      };
    }
  }

  /**
   * Verify phone number with code
   */
  async verifyPhoneNumber(request: PhoneVerificationConfirm): Promise<PhoneVerificationResult> {
    const { phoneNumber, verificationCode, userId } = request;

    // Format phone number
    const formattedPhone = formatPhoneNumberE164(phoneNumber);
    if (!formattedPhone) {
      return {
        success: false,
        message: 'Invalid phone number format',
      };
    }

    // Find verification record
    const { data: verification, error: fetchError } = await this.supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('phone_number', formattedPhone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verification) {
      return {
        success: false,
        message: 'No pending verification found for this phone number',
      };
    }

    // Check if expired
    if (new Date() > new Date(verification.expires_at)) {
      return {
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      };
    }

    // Check attempts
    if (verification.attempts >= verification.max_attempts) {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // Increment attempts
    const newAttempts = verification.attempts + 1;
    await this.supabase
      .from('phone_verifications')
      .update({ 
        attempts: newAttempts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', verification.id);

    // Check verification code
    if (verification.verification_code !== verificationCode) {
      const attemptsRemaining = verification.max_attempts - newAttempts;
      return {
        success: false,
        message: `Invalid verification code. ${attemptsRemaining} attempts remaining.`,
        attemptsRemaining,
      };
    }

    // Mark as verified
    const { error: updateError } = await this.supabase
      .from('phone_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', verification.id);

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update verification status',
      };
    }

    // Update user profile with verified phone
    const { error: profileError } = await this.supabase
      .from('profiles')
      .update({
        verified_phone: formattedPhone,
        phone_verified_at: new Date().toISOString(),
        sms_opt_in: true,
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail the verification, just log the error
    }

    return {
      success: true,
      message: 'Phone number verified successfully',
    };
  }

  /**
   * Check if phone number is verified for user
   */
  async isPhoneVerified(userId: string, phoneNumber: string): Promise<boolean> {
    const formattedPhone = formatPhoneNumberE164(phoneNumber);
    if (!formattedPhone) {
      return false;
    }

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('verified_phone, sms_opt_in')
      .eq('user_id', userId)
      .single();

    return profile?.verified_phone === formattedPhone && profile?.sms_opt_in === true;
  }

  /**
   * Opt out of SMS notifications
   */
  async optOutSMS(userId: string): Promise<PhoneVerificationResult> {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        sms_opt_in: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      return {
        success: false,
        message: 'Failed to opt out of SMS notifications',
      };
    }

    return {
      success: true,
      message: 'Successfully opted out of SMS notifications',
    };
  }

  /**
   * Get verification status for user
   */
  async getVerificationStatus(userId: string): Promise<{
    hasVerifiedPhone: boolean;
    verifiedPhone?: string;
    smsOptIn: boolean;
    verifiedAt?: string;
  }> {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('verified_phone, phone_verified_at, sms_opt_in')
      .eq('user_id', userId)
      .single();

    return {
      hasVerifiedPhone: !!profile?.verified_phone,
      verifiedPhone: profile?.verified_phone || undefined,
      smsOptIn: profile?.sms_opt_in || false,
      verifiedAt: profile?.phone_verified_at || undefined,
    };
  }
}

/**
 * Create phone verification service instance
 */
export function createPhoneVerificationService(supabase: SupabaseClient): PhoneVerificationService {
  return new PhoneVerificationService(supabase);
}