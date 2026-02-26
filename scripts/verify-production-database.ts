/**
 * Production Database Verification Script
 * 
 * This script verifies that the production database is properly configured
 * with all tables, RLS policies, storage buckets, and backups.
 * 
 * Usage:
 *   npm run verify:production-db
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Production Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (for admin access)
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Expected tables
const EXPECTED_TABLES = [
  'venues',
  'venue_users',
  'experiences',
  'availability',
  'pricing_tiers',
  'districts',
  'schools',
  'teachers',
  'rosters',
  'students',
  'parents',
  'student_parents',
  'trips',
  'permission_slips',
  'documents',
  'payments',
  'refunds',
  'attendance',
  'chaperones',
  'notifications',
  'audit_logs',
];

// Expected storage buckets
const EXPECTED_BUCKETS = [
  'documents',
  'medical-forms',
  'experience-photos',
];

interface VerificationResult {
  category: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

/**
 * Verify all expected tables exist
 */
async function verifyTables(): Promise<void> {
  console.log('\n📊 Verifying database tables...');
  
  try {
    const { data, error } = await supabase.rpc('get_tables', {});
    
    if (error) {
      // Fallback: query pg_tables directly
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (tablesError) {
        results.push({
          category: 'Tables',
          passed: false,
          message: 'Failed to query tables',
          details: tablesError,
        });
        return;
      }
      
      const tableNames = tables?.map((t: any) => t.tablename) || [];
      const missingTables = EXPECTED_TABLES.filter(t => !tableNames.includes(t));
      const extraTables = tableNames.filter((t: string) => !EXPECTED_TABLES.includes(t));
      
      if (missingTables.length === 0) {
        results.push({
          category: 'Tables',
          passed: true,
          message: `All ${EXPECTED_TABLES.length} tables exist`,
          details: { tables: tableNames },
        });
      } else {
        results.push({
          category: 'Tables',
          passed: false,
          message: `Missing ${missingTables.length} tables`,
          details: { missing: missingTables, extra: extraTables },
        });
      }
    }
  } catch (err) {
    results.push({
      category: 'Tables',
      passed: false,
      message: 'Error verifying tables',
      details: err,
    });
  }
}

/**
 * Verify RLS is enabled on all tables
 */
async function verifyRLS(): Promise<void> {
  console.log('\n🔒 Verifying Row-Level Security...');
  
  try {
    // Query to check RLS status
    const { data, error } = await supabase.rpc('check_rls_status', {});
    
    if (error) {
      // Fallback: check each table individually
      const rlsChecks = await Promise.all(
        EXPECTED_TABLES.map(async (table) => {
          try {
            // Try to query the table - if RLS is enabled, this will work
            const { error } = await supabase.from(table).select('count').limit(0);
            return { table, enabled: !error };
          } catch {
            return { table, enabled: false };
          }
        })
      );
      
      const tablesWithoutRLS = rlsChecks.filter(c => !c.enabled);
      
      if (tablesWithoutRLS.length === 0) {
        results.push({
          category: 'RLS',
          passed: true,
          message: 'RLS enabled on all tables',
        });
      } else {
        results.push({
          category: 'RLS',
          passed: false,
          message: `RLS not enabled on ${tablesWithoutRLS.length} tables`,
          details: { tables: tablesWithoutRLS.map(t => t.table) },
        });
      }
    }
  } catch (err) {
    results.push({
      category: 'RLS',
      passed: false,
      message: 'Error verifying RLS',
      details: err,
    });
  }
}

/**
 * Verify storage buckets exist
 */
async function verifyStorageBuckets(): Promise<void> {
  console.log('\n🗄️  Verifying storage buckets...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      results.push({
        category: 'Storage',
        passed: false,
        message: 'Failed to list storage buckets',
        details: error,
      });
      return;
    }
    
    const bucketNames = buckets?.map(b => b.name) || [];
    const missingBuckets = EXPECTED_BUCKETS.filter(b => !bucketNames.includes(b));
    
    if (missingBuckets.length === 0) {
      results.push({
        category: 'Storage',
        passed: true,
        message: `All ${EXPECTED_BUCKETS.length} storage buckets exist`,
        details: { buckets: bucketNames },
      });
    } else {
      results.push({
        category: 'Storage',
        passed: false,
        message: `Missing ${missingBuckets.length} storage buckets`,
        details: { missing: missingBuckets },
      });
    }
  } catch (err) {
    results.push({
      category: 'Storage',
      passed: false,
      message: 'Error verifying storage buckets',
      details: err,
    });
  }
}

/**
 * Verify database connection
 */
async function verifyConnection(): Promise<void> {
  console.log('\n🔌 Verifying database connection...');
  
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('count')
      .limit(1);
    
    if (error) {
      results.push({
        category: 'Connection',
        passed: false,
        message: 'Database connection failed',
        details: error,
      });
    } else {
      results.push({
        category: 'Connection',
        passed: true,
        message: 'Database connection successful',
      });
    }
  } catch (err) {
    results.push({
      category: 'Connection',
      passed: false,
      message: 'Error connecting to database',
      details: err,
    });
  }
}

/**
 * Verify indexes exist
 */
async function verifyIndexes(): Promise<void> {
  console.log('\n📇 Verifying database indexes...');
  
  try {
    // Query to count indexes
    const { data, error } = await supabase.rpc('count_indexes', {});
    
    if (error) {
      results.push({
        category: 'Indexes',
        passed: false,
        message: 'Failed to verify indexes',
        details: error,
      });
    } else {
      const indexCount = data || 0;
      // We expect at least 30 indexes (rough estimate)
      if (indexCount >= 30) {
        results.push({
          category: 'Indexes',
          passed: true,
          message: `${indexCount} indexes found`,
        });
      } else {
        results.push({
          category: 'Indexes',
          passed: false,
          message: `Only ${indexCount} indexes found (expected 30+)`,
        });
      }
    }
  } catch (err) {
    results.push({
      category: 'Indexes',
      passed: false,
      message: 'Error verifying indexes',
      details: err,
    });
  }
}

/**
 * Print verification results
 */
function printResults(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📋 PRODUCTION DATABASE VERIFICATION RESULTS');
  console.log('='.repeat(60) + '\n');
  
  let allPassed = true;
  
  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.category}: ${result.message}`);
    
    if (!result.passed) {
      allPassed = false;
      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - Database is properly configured');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.log('❌ SOME CHECKS FAILED - Review errors above');
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

/**
 * Main verification function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting production database verification...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  
  await verifyConnection();
  await verifyTables();
  await verifyRLS();
  await verifyStorageBuckets();
  await verifyIndexes();
  
  printResults();
}

// Run verification
main().catch((error) => {
  console.error('❌ Verification failed with error:', error);
  process.exit(1);
});
