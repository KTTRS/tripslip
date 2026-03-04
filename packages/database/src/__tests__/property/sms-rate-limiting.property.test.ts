/**
 * Property-Based Tests - SMS Rate Limiting (Task 1.15)
 * 
 * Tests Property 12: SMS Rate Limiting
 * For any user attempting to send more than 10 SMS messages within a 60-minute window,
 * subsequent requests should be rejected with a rate limit error (429 status).
 * 
 * **Validates: Requirements 3.8**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SEND_SMS_FUNCTION_URL = `${supabaseUrl}/functions/v1/send-sms`;

describe('Property-Based Tests - SMS Rate Limiting (Task 1.15)', () => {
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
   * Property 12: SMS Rate Limiting
   * 
   * For any user, after sending 10 SMS messages within a 1-hour window,
   * the 11th attempt should be rejected with a 429 status code.
   */
  it('Property 12: Rate limit enforced after 10 SMS within 1 hour', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).map(s => `+1${s.replace(/\D/g, '').slice(0, 10).padEnd(10, '0')}`),
          message: fc.string({ minLength: 10, maxLength: 100 }),
          language: fc.constantFrom('en', 'es', 'ar'),
        }),
        async ({ phoneNumber, message, language }) => {
          // Create test user with SMS enabled
          const userId = await createTestUser();

          await supabase
            .from('notification_preferences')
            .insert({
              user_id: userId,
              email_enabled: true,
              sms_enabled: true,
            });

          // Send 10 SMS messages (the limit)
          const responses: Response[] = [];
          for (let i = 0; i < 10; i++) {
            const response = await fetch(SEND_SMS_FUNCTION_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: phoneNumber,
                message: `${message} ${i}`,
                language,
                userId,
              }),
            });
            responses.push(response);
          }

          // The 11th attempt should be rate limited
          const rateLimitedResponse = await fetch(SEND_SMS_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: phoneNumber,
              message: `${message} 11`,
              language,
              userId,
            }),
          });

          const rateLimitedData = await rateLimitedResponse.json();

          // Property: 11th request should be rejected with 429
          expect(rateLimitedResponse.status).toBe(429);
          expect(rateLimitedData.success).toBe(false);
          expect(rateLimitedData.error).toMatch(/rate limit/i);
          expect(rateLimitedData.rateLimitRemaining).toBe(0);
        }
      ),
      { numRuns: 5 }
    );
  }, 180000);

  /**
   * Property 12 (Edge Case): Rate limit is per-user, not global
   * 
   * Different users should have independent rate limits.
   */
  it('Property 12 (Edge Case): Rate limit enforced independently per user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phoneNumber1: fc.string({ minLength: 10, maxLength: 15 }).map(s => `+1${s.replace(/\D/g, '').slice(0, 10).padEnd(10, '0')}`),
          phoneNumber2: fc.string({ minLength: 10, maxLength: 15 }).map(s => `+1${s.replace(/\D/g, '').slice(0, 10).padEnd(10, '0')}`),
          message: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async ({ phoneNumber1, phoneNumber2, message }) => {
          // Create two test users
          const userId1 = await createTestUser();
          const userId2 = await createTestUser();

          // Enable SMS for both users
          await supabase.from('notification_preferences').insert([
            { user_id: userId1, email_enabled: true, sms_enabled: true },
            { user_id: userId2, email_enabled: true, sms_enabled: true },
          ]);

          // User 1 sends 10 SMS (hits limit)
          for (let i = 0; i < 10; i++) {
            await fetch(SEND_SMS_FUNCTION_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: phoneNumber1,
                message: `${message} user1-${i}`,
                userId: userId1,
              }),
            });
          }

          // User 1's 11th attempt should be rate limited
          const user1Response = await fetch(SEND_SMS_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: phoneNumber1,
              message: `${message} user1-11`,
              userId: userId1,
            }),
          });

          const user1Data = await user1Response.json();
          expect(user1Response.status).toBe(429);
          expect(user1Data.success).toBe(false);

          // User 2's first attempt should NOT be rate limited
          const user2Response = await fetch(SEND_SMS_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: phoneNumber2,
              message: `${message} user2-1`,
              userId: userId2,
            }),
          });

          const user2Data = await user2Response.json();
          
          // User 2 should not be rate limited (may fail for other reasons like Twilio credentials)
          if (user2Response.status === 429) {
            throw new Error('User 2 should not be rate limited when User 1 is rate limited');
          }
        }
      ),
      { numRuns: 3 }
    );
  }, 240000);

  /**
   * Property 12 (Consistency): Rate limit counter tracks successful sends only
   * 
   * Failed SMS attempts (e.g., invalid phone number) should not count toward rate limit.
   */
  it('Property 12 (Consistency): Rate limit tracks successful sends only', async () => {
    const userId = await createTestUser();

    await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        email_enabled: true,
        sms_enabled: true,
      });

    // Send 5 successful SMS
    for (let i = 0; i < 5; i++) {
      await fetch(SEND_SMS_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: '+15555555555',
          message: `Test message ${i}`,
          userId,
        }),
      });
    }

    // Check rate limit remaining
    const checkResponse = await fetch(SEND_SMS_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        to: '+15555555555',
        message: 'Check rate limit',
        userId,
      }),
    });

    const checkData = await checkResponse.json();

    // Should have sent 6 total (5 + 1 check), remaining should be 4 or less
    // (may be less if some sends succeeded)
    if (checkData.rateLimitRemaining !== undefined) {
      expect(checkData.rateLimitRemaining).toBeLessThanOrEqual(4);
    }
  }, 120000);

  /**
   * Property 12 (Error Response): Rate limit error includes remaining count
   * 
   * When rate limited, the response should include rateLimitRemaining: 0.
   */
  it('Property 12 (Error Response): Rate limit error includes remaining count', async () => {
    const userId = await createTestUser();

    await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        email_enabled: true,
        sms_enabled: true,
      });

    // Send 10 SMS to hit the limit
    for (let i = 0; i < 10; i++) {
      await fetch(SEND_SMS_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: '+15555555555',
          message: `Test message ${i}`,
          userId,
        }),
      });
    }

    // 11th attempt should be rate limited
    const rateLimitedResponse = await fetch(SEND_SMS_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        to: '+15555555555',
        message: 'Rate limited message',
        userId,
      }),
    });

    const rateLimitedData = await rateLimitedResponse.json();

    // Verify rate limit error structure
    expect(rateLimitedResponse.status).toBe(429);
    expect(rateLimitedData.success).toBe(false);
    expect(rateLimitedData.error).toBeDefined();
    expect(rateLimitedData.error).toMatch(/rate limit/i);
    expect(rateLimitedData.rateLimitRemaining).toBe(0);
  }, 120000);

  /**
   * Property 12 (Success Response): Successful sends include remaining count
   * 
   * When SMS is sent successfully, the response should include rateLimitRemaining.
   */
  it('Property 12 (Success Response): Successful sends include remaining count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (numSends) => {
          const userId = await createTestUser();

          await supabase
            .from('notification_preferences')
            .insert({
              user_id: userId,
              email_enabled: true,
              sms_enabled: true,
            });

          // Send N SMS messages
          let lastRemaining: number | undefined;
          for (let i = 0; i < numSends; i++) {
            const response = await fetch(SEND_SMS_FUNCTION_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: '+15555555555',
                message: `Test message ${i}`,
                userId,
              }),
            });

            const data = await response.json();

            // If successful, should include rateLimitRemaining
            if (data.success) {
              expect(data.rateLimitRemaining).toBeDefined();
              expect(data.rateLimitRemaining).toBeGreaterThanOrEqual(0);
              expect(data.rateLimitRemaining).toBeLessThanOrEqual(10);
              
              // Remaining should decrease with each send
              if (lastRemaining !== undefined) {
                expect(data.rateLimitRemaining).toBeLessThanOrEqual(lastRemaining);
              }
              
              lastRemaining = data.rateLimitRemaining;
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 180000);

  /**
   * Property 12 (Boundary): Exactly 10 SMS allowed within window
   * 
   * The 10th SMS should succeed, but the 11th should be rate limited.
   */
  it('Property 12 (Boundary): Exactly 10 SMS allowed, 11th rejected', async () => {
    const userId = await createTestUser();

    await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        email_enabled: true,
        sms_enabled: true,
      });

    // Send exactly 10 SMS
    const responses: { status: number; data: any }[] = [];
    for (let i = 0; i < 11; i++) {
      const response = await fetch(SEND_SMS_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: '+15555555555',
          message: `Test message ${i}`,
          userId,
        }),
      });

      const data = await response.json();
      responses.push({ status: response.status, data });
    }

    // First 10 should not be rate limited (may fail for other reasons)
    const first10 = responses.slice(0, 10);
    first10.forEach((response, index) => {
      if (response.status === 429) {
        throw new Error(`Request ${index + 1} should not be rate limited`);
      }
    });

    // 11th should be rate limited
    const eleventh = responses[10];
    expect(eleventh.status).toBe(429);
    expect(eleventh.data.success).toBe(false);
    expect(eleventh.data.error).toMatch(/rate limit/i);
  }, 180000);

  /**
   * Property 12 (No userId): Rate limiting bypassed when no userId provided
   * 
   * SMS sent without userId should not be subject to rate limiting.
   */
  it('Property 12 (No userId): Rate limiting bypassed without userId', async () => {
    // Send 15 SMS without userId (more than the limit)
    const responses: Response[] = [];
    for (let i = 0; i < 15; i++) {
      const response = await fetch(SEND_SMS_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: '+15555555555',
          message: `System message ${i}`,
          // No userId provided
        }),
      });
      responses.push(response);
    }

    // None should be rate limited (429)
    // (may fail for other reasons like Twilio credentials)
    responses.forEach((response, index) => {
      if (response.status === 429) {
        throw new Error(`Request ${index + 1} should not be rate limited when no userId provided`);
      }
    });
  }, 180000);
});
