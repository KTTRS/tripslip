/**
 * Create Test Users Script
 * 
 * This script creates test users for automated testing using the Supabase Admin API.
 * It requires the SUPABASE_SERVICE_ROLE_KEY environment variable to be set.
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your-key npm run create-test-users
 * 
 * Or add SUPABASE_SERVICE_ROLE_KEY to your .env file and run:
 *   npm run create-test-users
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   Required: VITE_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('   To get your service role key:');
  console.error('   1. Go to https://supabase.com/dashboard/project/_/settings/api');
  console.error('   2. Copy the "service_role" key (keep it secret!)');
  console.error('   3. Add it to your .env file as SUPABASE_SERVICE_ROLE_KEY=your-key');
  console.error('');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test users to create
const testUsers = [
  {
    email: 'venue-review-test-user@example.com',
    password: 'testpassword123',
    email_confirm: true,
    user_metadata: {
      name: 'Venue Review Test User',
    },
  },
];

async function createTestUsers() {
  console.log('🔧 Creating test users...\n');

  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find((u) => u.email === user.email);

      if (existingUser) {
        console.log(`✅ User already exists: ${user.email}`);
        console.log(`   User ID: ${existingUser.id}`);
        continue;
      }

      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: user.email_confirm,
        user_metadata: user.user_metadata,
      });

      if (error) {
        console.error(`❌ Failed to create user ${user.email}:`, error.message);
        continue;
      }

      console.log(`✅ Created user: ${user.email}`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Password: ${user.password}`);
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error);
    }
  }

  console.log('\n✨ Done!');
}

createTestUsers().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
