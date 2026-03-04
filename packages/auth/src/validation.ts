/**
 * Validation Utilities for Authentication
 * Provides validation functions for email, password, and organization data
 */

import type { SupabaseClient } from '@tripslip/database';
import type { OrganizationType } from './types';
import {
  InvalidEmailError,
  WeakPasswordError,
  InvalidOrganizationError,
} from './errors';

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * @param email - Email address to validate
 * @throws InvalidEmailError if email format is invalid
 */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new InvalidEmailError();
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    throw new InvalidEmailError();
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @throws WeakPasswordError if password doesn't meet requirements
 */
export function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new WeakPasswordError();
  }

  if (password.length < 8) {
    throw new WeakPasswordError();
  }
}

/**
 * Validate organization exists and matches type
 * @param supabase - Supabase client
 * @param organizationType - Type of organization
 * @param organizationId - Organization ID
 * @throws InvalidOrganizationError if organization doesn't exist or type mismatch
 */
export async function validateOrganization(
  supabase: SupabaseClient,
  organizationType: OrganizationType,
  organizationId: string
): Promise<void> {
  let tableName: string;
  
  switch (organizationType) {
    case 'school':
      tableName = 'schools';
      break;
    case 'district':
      tableName = 'districts';
      break;
    case 'venue':
      tableName = 'venues';
      break;
    case 'platform':
      // Platform type doesn't need validation
      return;
    default:
      throw new InvalidOrganizationError(organizationType, organizationId);
  }

  const { data, error } = await (supabase as any)
    .from(tableName)
    .select('id')
    .eq('id', organizationId)
    .single();

  if (error || !data) {
    throw new InvalidOrganizationError(organizationType, organizationId);
  }
}

/**
 * Validate signup parameters
 * @param supabase - Supabase client
 * @param email - Email address
 * @param password - Password
 * @param organizationType - Organization type
 * @param organizationId - Organization ID
 */
export async function validateSignupParams(
  supabase: SupabaseClient,
  email: string,
  password: string,
  organizationType: OrganizationType,
  organizationId: string
): Promise<void> {
  validateEmail(email);
  validatePassword(password);
  await validateOrganization(supabase, organizationType, organizationId);
}
