#!/usr/bin/env tsx

/**
 * Stripe Setup Verification Script
 * 
 * This script verifies that Stripe is properly configured for the TripSlip platform.
 * It checks environment variables, API connectivity, and webhook configuration.
 * 
 * Usage:
 *   npm run verify:stripe
 *   or
 *   tsx scripts/verify-stripe-setup.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

interface VerificationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const results: VerificationResult[] = [];

function addResult(check: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string) {
  results.push({ check, status, message, details });
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('STRIPE SETUP VERIFICATION RESULTS');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.check}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    console.log();
  });

  console.log('='.repeat(80));
  console.log(`Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log('='.repeat(80) + '\n');

  if (failed > 0) {
    console.log('❌ Stripe setup is incomplete. Please address the failed checks above.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  Stripe setup has warnings. Review the warnings above.');
    process.exit(0);
  } else {
    console.log('✅ Stripe setup is complete and verified!');
    process.exit(0);
  }
}

async function verifyEnvironmentVariables() {
  console.log('Checking environment variables...\n');

  // Check publishable key
  const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    addResult(
      'Publishable Key',
      'fail',
      'VITE_STRIPE_PUBLISHABLE_KEY is not set',
      'Set this in your .env file'
    );
  } else if (publishableKey.startsWith('pk_test_')) {
    addResult(
      'Publishable Key',
      'warning',
      'Using test mode publishable key',
      'This is fine for development. Use pk_live_ for production.'
    );
  } else if (publishableKey.startsWith('pk_live_')) {
    addResult(
      'Publishable Key',
      'pass',
      'Production publishable key is set'
    );
  } else {
    addResult(
      'Publishable Key',
      'fail',
      'Invalid publishable key format',
      'Key should start with pk_test_ or pk_live_'
    );
  }

  // Check secret key
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    addResult(
      'Secret Key',
      'fail',
      'STRIPE_SECRET_KEY is not set',
      'Set this in your .env file'
    );
  } else if (secretKey.startsWith('sk_test_')) {
    addResult(
      'Secret Key',
      'warning',
      'Using test mode secret key',
      'This is fine for development. Use sk_live_ for production.'
    );
  } else if (secretKey.startsWith('sk_live_')) {
    addResult(
      'Secret Key',
      'pass',
      'Production secret key is set'
    );
  } else {
    addResult(
      'Secret Key',
      'fail',
      'Invalid secret key format',
      'Key should start with sk_test_ or sk_live_'
    );
  }

  // Check webhook secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    addResult(
      'Webhook Secret',
      'fail',
      'STRIPE_WEBHOOK_SECRET is not set',
      'Set this in your .env file'
    );
  } else if (webhookSecret.startsWith('whsec_')) {
    addResult(
      'Webhook Secret',
      'pass',
      'Webhook secret is set'
    );
  } else {
    addResult(
      'Webhook Secret',
      'fail',
      'Invalid webhook secret format',
      'Secret should start with whsec_'
    );
  }

  // Check key consistency (test vs live)
  if (publishableKey && secretKey) {
    const publishableIsTest = publishableKey.startsWith('pk_test_');
    const secretIsTest = secretKey.startsWith('sk_test_');
    
    if (publishableIsTest !== secretIsTest) {
      addResult(
        'Key Consistency',
        'fail',
        'Publishable and secret keys are from different modes',
        'Both keys must be either test or live mode'
      );
    } else {
      addResult(
        'Key Consistency',
        'pass',
        'Publishable and secret keys are from the same mode'
      );
    }
  }
}

async function verifyStripeAPI() {
  console.log('Verifying Stripe API connectivity...\n');

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    addResult(
      'API Connectivity',
      'fail',
      'Cannot test API connectivity without secret key'
    );
    return;
  }

  try {
    // Test API connectivity by retrieving account info
    const response = await fetch('https://api.stripe.com/v1/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.ok) {
      const data = await response.json();
      addResult(
        'API Connectivity',
        'pass',
        'Successfully connected to Stripe API',
        `Available balance: ${data.available?.[0]?.amount || 0} ${data.available?.[0]?.currency || 'usd'}`
      );
    } else {
      const error = await response.json();
      addResult(
        'API Connectivity',
        'fail',
        'Failed to connect to Stripe API',
        `Error: ${error.error?.message || 'Unknown error'}`
      );
    }
  } catch (error) {
    addResult(
      'API Connectivity',
      'fail',
      'Failed to connect to Stripe API',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function verifyWebhookEndpoint() {
  console.log('Checking webhook endpoint configuration...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    addResult(
      'Webhook Endpoint',
      'warning',
      'Cannot verify webhook endpoint without VITE_SUPABASE_URL',
      'Set VITE_SUPABASE_URL in your .env file'
    );
    return;
  }

  const webhookUrl = `${supabaseUrl}/functions/v1/stripe-webhook`;
  
  try {
    // Try to reach the webhook endpoint
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    // We expect a 400 error because we're not sending a valid Stripe signature
    // If we get 400, it means the endpoint exists and is responding
    if (response.status === 400) {
      addResult(
        'Webhook Endpoint',
        'pass',
        'Webhook endpoint is accessible',
        `URL: ${webhookUrl}`
      );
    } else if (response.status === 404) {
      addResult(
        'Webhook Endpoint',
        'fail',
        'Webhook endpoint not found',
        `URL: ${webhookUrl} - Make sure the stripe-webhook Edge Function is deployed`
      );
    } else {
      addResult(
        'Webhook Endpoint',
        'warning',
        `Webhook endpoint returned unexpected status: ${response.status}`,
        `URL: ${webhookUrl}`
      );
    }
  } catch (error) {
    addResult(
      'Webhook Endpoint',
      'fail',
      'Failed to reach webhook endpoint',
      `URL: ${webhookUrl} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function verifyStripeAccount() {
  console.log('Verifying Stripe account details...\n');

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    addResult(
      'Account Details',
      'fail',
      'Cannot verify account without secret key'
    );
    return;
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.ok) {
      const account = await response.json();
      
      // Check if account is fully onboarded
      if (account.charges_enabled && account.payouts_enabled) {
        addResult(
          'Account Status',
          'pass',
          'Stripe account is fully activated',
          `Business name: ${account.business_profile?.name || 'Not set'}`
        );
      } else {
        addResult(
          'Account Status',
          'warning',
          'Stripe account is not fully activated',
          `Charges enabled: ${account.charges_enabled}, Payouts enabled: ${account.payouts_enabled}`
        );
      }

      // Check if business profile is complete
      if (account.business_profile?.name && account.business_profile?.url) {
        addResult(
          'Business Profile',
          'pass',
          'Business profile is configured'
        );
      } else {
        addResult(
          'Business Profile',
          'warning',
          'Business profile is incomplete',
          'Complete your business profile in Stripe Dashboard'
        );
      }
    } else {
      const error = await response.json();
      addResult(
        'Account Details',
        'fail',
        'Failed to retrieve account details',
        `Error: ${error.error?.message || 'Unknown error'}`
      );
    }
  } catch (error) {
    addResult(
      'Account Details',
      'fail',
      'Failed to retrieve account details',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function verifyPaymentMethods() {
  console.log('Checking payment method configuration...\n');

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    addResult(
      'Payment Methods',
      'fail',
      'Cannot verify payment methods without secret key'
    );
    return;
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/payment_method_configurations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        addResult(
          'Payment Methods',
          'pass',
          'Payment methods are configured',
          `${data.data.length} configuration(s) found`
        );
      } else {
        addResult(
          'Payment Methods',
          'warning',
          'No payment method configurations found',
          'Configure payment methods in Stripe Dashboard → Settings → Payment methods'
        );
      }
    } else {
      addResult(
        'Payment Methods',
        'warning',
        'Could not verify payment methods',
        'Check payment method settings in Stripe Dashboard'
      );
    }
  } catch (error) {
    addResult(
      'Payment Methods',
      'warning',
      'Could not verify payment methods',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function main() {
  console.log('\n🔍 Starting Stripe Setup Verification...\n');

  await verifyEnvironmentVariables();
  await verifyStripeAPI();
  await verifyWebhookEndpoint();
  await verifyStripeAccount();
  await verifyPaymentMethods();

  printResults();
}

main().catch(error => {
  console.error('Verification script failed:', error);
  process.exit(1);
});
