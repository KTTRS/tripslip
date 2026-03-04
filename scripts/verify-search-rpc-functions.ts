#!/usr/bin/env tsx
/**
 * Verify Search RPC Functions
 * 
 * This script checks if the search RPC functions exist in the database
 * and tests them to ensure they work correctly.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRPCFunctions() {
  console.log('🔍 Verifying Search RPC Functions\n');
  console.log('=' .repeat(60));

  // Test 1: Check if search_venues_by_text exists
  console.log('\n1. Testing search_venues_by_text RPC function...');
  try {
    const { data, error } = await supabase.rpc('search_venues_by_text', {
      search_query: 'museum',
      max_results: 5
    });

    if (error) {
      console.error('❌ search_venues_by_text failed:', error.message);
      console.error('   Error details:', error);
    } else {
      console.log('✅ search_venues_by_text exists and works');
      console.log(`   Returned ${data?.length || 0} results`);
      if (data && data.length > 0) {
        console.log('   Sample result:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Exception calling search_venues_by_text:', err);
  }

  // Test 2: Check if venues_within_radius exists (note: not search_venues_by_location)
  console.log('\n2. Testing venues_within_radius RPC function...');
  try {
    const { data, error } = await supabase.rpc('venues_within_radius', {
      lat: 42.3601,
      lng: -71.0589,
      radius_meters: 10000, // 10km
      venue_ids: null
    });

    if (error) {
      console.error('❌ venues_within_radius failed:', error.message);
      console.error('   Error details:', error);
    } else {
      console.log('✅ venues_within_radius exists and works');
      console.log(`   Returned ${data?.length || 0} results`);
      if (data && data.length > 0) {
        console.log('   Sample result:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Exception calling venues_within_radius:', err);
  }

  // Test 3: Check if search_venues exists (combined search function)
  console.log('\n3. Testing search_venues RPC function...');
  try {
    const { data, error } = await supabase.rpc('search_venues', {
      search_text: 'museum',
      center_lat: 42.3601,
      center_lng: -71.0589,
      radius_miles: 10,
      min_capacity: null,
      max_capacity: null,
      verified_only: false,
      max_results: 5
    });

    if (error) {
      console.error('❌ search_venues failed:', error.message);
      console.error('   Error details:', error);
    } else {
      console.log('✅ search_venues exists and works');
      console.log(`   Returned ${data?.length || 0} results`);
      if (data && data.length > 0) {
        console.log('   Sample result:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Exception calling search_venues:', err);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary:');
  console.log('   - search_venues_by_text: RPC function for text search');
  console.log('   - venues_within_radius: RPC function for geographic search');
  console.log('   - search_venues: Combined search function');
  console.log('\n   Note: The task mentions "search_venues_by_location" but the');
  console.log('   actual function name is "venues_within_radius"');
}

verifyRPCFunctions().catch(console.error);
