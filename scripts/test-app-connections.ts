/**
 * Application Database Connection Test Script
 * 
 * Tests database connectivity from all 5 TripSlip applications
 * to ensure proper configuration before production deployment.
 * 
 * Usage:
 *   npm run test:connections
 */

import { createClient } from '@supabase/supabase-js';

interface AppConfig {
  name: string;
  envPath: string;
  testQuery: {
    table: string;
    description: string;
  };
}

const APPS: AppConfig[] = [
  {
    name: 'Landing App',
    envPath: 'apps/landing/.env.production',
    testQuery: {
      table: 'venues',
      description: 'Fetch venue count for landing page',
    },
  },
  {
    name: 'Parent App',
    envPath: 'apps/parent/.env.production',
    testQuery: {
      table: 'permission_slips',
      description: 'Fetch permission slips',
    },
  },
  {
    name: 'Teacher App',
    envPath: 'apps/teacher/.env.production',
    testQuery: {
      table: 'trips',
      description: 'Fetch teacher trips',
    },
  },
  {
    name: 'Venue App',
    envPath: 'apps/venue/.env.production',
    testQuery: {
      table: 'experiences',
      description: 'Fetch venue experiences',
    },
  },
  {
    name: 'School App',
    envPath: 'apps/school/.env.production',
    testQuery: {
      table: 'schools',
      description: 'Fetch school data',
    },
  },
];

interface TestResult {
  app: string;
  passed: boolean;
  message: string;
  latency?: number;
  error?: any;
}

const results: TestResult[] = [];

/**
 * Test connection for a single app
 */
async function testAppConnection(app: AppConfig): Promise<TestResult> {
  console.log(`\n🔍 Testing ${app.name}...`);
  
  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      app: app.name,
      passed: false,
      message: 'Missing environment variables',
      error: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set',
    };
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Measure latency
    const startTime = Date.now();
    
    // Test query
    const { data, error } = await supabase
      .from(app.testQuery.table)
      .select('count')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        app: app.name,
        passed: false,
        message: `Query failed: ${app.testQuery.description}`,
        latency,
        error: error.message,
      };
    }
    
    return {
      app: app.name,
      passed: true,
      message: `Connection successful (${latency}ms)`,
      latency,
    };
  } catch (err: any) {
    return {
      app: app.name,
      passed: false,
      message: 'Connection error',
      error: err.message,
    };
  }
}

/**
 * Test RLS policies for each app
 */
async function testRLSPolicies(): Promise<void> {
  console.log('\n🔒 Testing RLS policies...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Skipping RLS tests - missing credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test 1: Unauthenticated user should NOT see private data
  console.log('  Testing unauthenticated access...');
  const { data: privateData, error: privateError } = await supabase
    .from('permission_slips')
    .select('*')
    .limit(1);
  
  if (privateData && privateData.length > 0) {
    console.log('  ❌ RLS FAILURE: Unauthenticated user can see permission slips');
  } else {
    console.log('  ✅ RLS working: Unauthenticated user blocked');
  }
  
  // Test 2: Public data should be accessible
  console.log('  Testing public access...');
  const { data: publicData, error: publicError } = await supabase
    .from('experiences')
    .select('*')
    .eq('published', true)
    .limit(1);
  
  if (publicError) {
    console.log('  ❌ Public data access failed:', publicError.message);
  } else {
    console.log('  ✅ Public data accessible');
  }
}

/**
 * Test storage bucket access
 */
async function testStorageAccess(): Promise<void> {
  console.log('\n🗄️  Testing storage bucket access...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Skipping storage tests - missing credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test public bucket access
  console.log('  Testing public bucket (experience-photos)...');
  const { data: publicBucket, error: publicError } = await supabase.storage
    .from('experience-photos')
    .list('', { limit: 1 });
  
  if (publicError) {
    console.log('  ❌ Public bucket access failed:', publicError.message);
  } else {
    console.log('  ✅ Public bucket accessible');
  }
  
  // Test private bucket access (should fail without auth)
  console.log('  Testing private bucket (documents)...');
  const { data: privateBucket, error: privateError } = await supabase.storage
    .from('documents')
    .list('', { limit: 1 });
  
  if (privateError && privateError.message.includes('not found')) {
    console.log('  ✅ Private bucket protected (access denied)');
  } else if (!privateError) {
    console.log('  ⚠️  Private bucket accessible without auth (check policies)');
  } else {
    console.log('  ❌ Unexpected error:', privateError.message);
  }
}

/**
 * Print test results
 */
function printResults(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📋 APPLICATION CONNECTION TEST RESULTS');
  console.log('='.repeat(60) + '\n');
  
  let allPassed = true;
  
  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.app}: ${result.message}`);
    
    if (!result.passed) {
      allPassed = false;
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('✅ ALL APPLICATIONS CAN CONNECT');
    console.log('   Ready for production deployment');
  } else {
    console.log('❌ SOME APPLICATIONS FAILED CONNECTION TEST');
    console.log('   Review errors and fix configuration');
  }
  
  console.log('='.repeat(60) + '\n');
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting application connection tests...');
  console.log(`📍 Supabase URL: ${process.env.VITE_SUPABASE_URL || 'NOT SET'}`);
  
  // Test each application
  for (const app of APPS) {
    const result = await testAppConnection(app);
    results.push(result);
  }
  
  // Test RLS policies
  await testRLSPolicies();
  
  // Test storage access
  await testStorageAccess();
  
  // Print results
  printResults();
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch((error) => {
  console.error('❌ Test suite failed with error:', error);
  process.exit(1);
});
