/**
 * Property-Based Tests - SMS Opt-In Enforcement (Task 1.14)
 * 
 * Tests Property 10: SMS Opt-In Enforcement
 * For any SMS notification, the message should only be sent to users who have 
 * explicitly opted in to SMS notifications.
 * 
 * **Validates: Requirements 3.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SEND_SMS_FUNCTION_URL = `${supabaseUrl}/functions/v1/send-sms`;

describe('Property-Based Tests - SMS Opt-In Enforcement (Task 1.14)', () => {
  let supabase: SupabaseClient;
  const testUserIds: string[] = [];

  // Helper function to create a test user in auth.users
  async function createTestUser(): Promise<string> {
    const email = `test-${Date.now()}-${Math.random()}@example.com`;
    const password = 'TestPassword123!';
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error(`Failed to create test user: ${error?.message}`);
    }

    testUserIds.push(data.user.id);
    return data.user.id;
  }

  beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserIds.length > 0) {
      await supabase.from('notification_preferences').delete().in('user_id', testUserIds);
      // Clean up auth users
      for (const userId of testUserIds) {
        await supabase.auth.admin.deleteUser(userId);
      }
      testUserIds.length = 0;
    }
  });

  /**
   * Property 10: SMS Opt-In Enforcement
   * 
   * For any user with sms_enabled = false or no notification preferences,
   * attempting to send SMS should be rejected with 403 status.
   */
  it('Property 10: SMS send rejected for users who have not opted in', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random phone number and message
        fc.record({
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).map(s => `+1${s.replace(/\D/g, '').slice(0, 10).padEnd(10, '0')}`),
          message: fc.string({ minLength: 10, maxLength: 100 }),
          language: fc.constantFrom('en', 'es', 'ar'),
          smsEnabled: fc.boolean(),
        }),
        async ({ phoneNumber, message, language, smsEnabled }) => {
          // Create test user with notification preferences
          const userId = await createTestUser();

          // Insert notification preferences with sms_enabled set to the generated value
          const { error: prefError } = await supabase
            .from('notification_preferences')
            .insert({
              user_id: userId,
              email_enabled: true,
              sms_enabled: smsEnabled,
            });

          if (prefError) {
            throw new Error(`Failed to create notification preferences: ${prefError.message}`);
          }

          // Attempt to send SMS via Edge Function
          const response = await fetch(SEND_SMS_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: phoneNumber,
              message,
              language,
              userId,
            }),
          });

          const data = await response.json();

          // Property: If sms_enabled is false, request should be rejected with 403
          if (!smsEnabled) {
            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.error).toContain('not opted in');
          } else {
            // If opted in, should not return 403 for opt-in reasons
            // (may fail for other reasons like invalid Twilio credentials in test environment)
            if (response.status === 403) {
              expect(data.error).not.toContain('not opted in');
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  /**
   * Property 10 (Edge Case): User with no notification preferences defaults to opt-out
   * 
   * When a user has no notification_preferences record, SMS should be rejected.
   */
  it('Property 10 (Edge Case): SMS rejected for user with no notification preferences', async () => {
    const userId = await createTestUser();

    // Do NOT create notification preferences for this user
    // Delete any auto-created preferences
    await supabase.from('notification_preferences').delete().eq('user_id', userId);

    // Attempt to send SMS
    const response = await fetch(SEND_SMS_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        to: '+15555555555',
        message: 'Test message',
        language: 'en',
        userId,
      }),
    });

    const data = await response.json();

    // Should be rejected with 403
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not opted in');
  }, 60000);

  /**
   * Property 10 (Consistency): SMS without userId bypasses opt-in check
   * 
   * When no userId is provided, the SMS function should not perform opt-in validation.
   * This allows system-level SMS (e.g., verification codes) to be sent.
   */
  it('Property 10 (Consistency): SMS without userId bypasses opt-in check', async () => {
    // Attempt to send SMS without userId
    const response = await fetch(SEND_SMS_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        to: '+15555555555',
        message: 'System message',
        language: 'en',
        // No userId provided
      }),
    });

    const data = await response.json();

    // Should NOT return 403 for opt-in reasons
    // (may fail for other reasons like Twilio credentials)
    if (response.status === 403) {
      expect(data.error).not.toContain('not opted in');
    }
  }, 60000);

  /**
   * Property 10 (State Transition): Changing opt-in status immediately affects SMS delivery
   * 
   * When a user's sms_enabled status changes, subsequent SMS attempts should
   * immediately reflect the new status.
   */
  it('Property 10 (State Transition): Opt-in status change immediately affects SMS delivery', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).map(s => `+1${s.replace(/\D/g, '').slice(0, 10).padEnd(10, '0')}`),
          message: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async ({ phoneNumber, message }) => {
          const userId = await createTestUser();

          // Start with SMS disabled
          await supabase
            .from('notification_preferences')
            .insert({
              user_id: userId,
              email_enabled: true,
              sms_enabled: false,
            });

          // First attempt should be rejected
          const response1 = await fetch(SEND_SMS_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: phoneNumber,
              message,
              userId,
            }),
          });

          const data1 = await response1.json();
          expect(response1.status).toBe(403);
          expect(data1.success).toBe(false);

          // Enable SMS
          const { error: updateError } = await supabase
            .from('notification_preferences')
            .update({ sms_enabled: true })
            .eq('user_id', userId);

          if (updateError) {
            throw new Error(`Failed to update preferences: ${updateError.message}`);
          }

          // Verify the update was successful
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('sms_enabled')
            .eq('user_id', userId)
            .single();

          expect(prefs?.sms_enabled).toBe(true);

          // Second attempt should not be rejected for opt-in reasons
          const response2 = await fetch(SEND_SMS_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: phoneNumber,
              message,
              userId,
            }),
          });

          const data2 = await response2.json();
          
          // Should not return 403 for opt-in reasons
          // (may fail with 500 for Twilio credentials, but not 403 for opt-in)
          if (response2.status === 403) {
            expect(data2.error).not.toContain('not opted in');
          }

          // Disable SMS again
          await supabase
            .from('notification_preferences')
            .update({ sms_enabled: false })
            .eq('user_id', userId);

          // Third attempt should be rejected again
          const response3 = await fetch(SEND_SMS_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: phoneNumber,
              message,
              userId,
            }),
          });

          const data3 = await response3.json();
          expect(response3.status).toBe(403);
          expect(data3.success).toBe(false);
          expect(data3.error).toContain('not opted in');
        }
      ),
      { numRuns: 10 }
    );
  }, 180000);

  /**
   * Property 10 (Multiple Users): Opt-in status is enforced independently per user
   * 
   * For multiple users with different opt-in statuses, SMS delivery should be
   * enforced correctly for each user independently.
   */
  it('Property 10 (Multiple Users): Opt-in enforced independently per user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            smsEnabled: fc.boolean(),
            phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).map(s => `+1${s.replace(/\D/g, '').slice(0, 10).padEnd(10, '0')}`),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (users) => {
          // Create users with different opt-in statuses
          const userIds: string[] = [];
          
          for (const user of users) {
            const userId = await createTestUser();
            userIds.push(userId);

            await supabase
              .from('notification_preferences')
              .insert({
                user_id: userId,
                email_enabled: true,
                sms_enabled: user.smsEnabled,
              });
          }

          // Attempt to send SMS to each user
          const results = await Promise.all(
            users.map(async (user, index) => {
              const response = await fetch(SEND_SMS_FUNCTION_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                  to: user.phoneNumber,
                  message: 'Test message',
                  userId: userIds[index],
                }),
              });

              const data = await response.json();
              return {
                smsEnabled: user.smsEnabled,
                status: response.status,
                success: data.success,
                error: data.error,
              };
            })
          );

          // Verify each user's result matches their opt-in status
          results.forEach((result, index) => {
            if (!result.smsEnabled) {
              expect(result.status).toBe(403);
              expect(result.success).toBe(false);
              expect(result.error).toContain('not opted in');
            } else {
              // If opted in, should not be rejected for opt-in reasons
              // (may fail with 500 for Twilio credentials, but not 403 for opt-in)
              if (result.status === 403) {
                expect(result.error).not.toContain('not opted in');
              }
            }
          });
        }
      ),
      { numRuns: 5 }
    );
  }, 180000);

  /**
   * Property 10 (Error Message): Rejection error message is clear and actionable
   * 
   * When SMS is rejected due to opt-in status, the error message should clearly
   * indicate the reason and be consistent across all rejections.
   */
  it('Property 10 (Error Message): Rejection provides clear opt-in error message', async () => {
    const userId = await createTestUser();

    // Create user with SMS disabled
    await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        email_enabled: true,
        sms_enabled: false,
      });

    // Attempt to send SMS
    const response = await fetch(SEND_SMS_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        to: '+15555555555',
        message: 'Test message',
        userId,
      }),
    });

    const data = await response.json();

    // Verify error message is clear and actionable
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error).toMatch(/opt.*in|SMS.*notification/i);
    
    // Error message should mention opt-in or SMS notifications
    const errorLower = data.error.toLowerCase();
    expect(
      errorLower.includes('opt') || 
      errorLower.includes('sms') || 
      errorLower.includes('notification')
    ).toBe(true);
  }, 60000);
});
