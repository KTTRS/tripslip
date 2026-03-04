/**
 * Test database configuration and utilities
 * Provides setup and teardown for test database operations
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Test database configuration
export const testDatabaseConfig = {
  // Test database connection
  createTestClient: (): SupabaseClient => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.TEST_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.TEST_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing test database configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
      );
    }
    
    return createClient(supabaseUrl, supabaseKey);
  },
  
  // Verify test database connection
  verifyConnection: async (client: SupabaseClient): Promise<boolean> => {
    try {
      const { data, error } = await client.from('profiles').select('count').limit(1);
      return !error;
    } catch (error) {
      console.warn('Test database connection failed:', error);
      return false;
    }
  },
  
  // Check if running against test database
  isTestDatabase: (client: SupabaseClient): boolean => {
    const url = (client as any).supabaseUrl;
    return url?.includes('test') || url?.includes('staging') || url?.includes('dev');
  },
};

// Test data management
export const testDataManager = {
  // Clean up test data after tests
  cleanupTestData: async (client: SupabaseClient, testIds: string[] = []): Promise<void> => {
    if (!testDatabaseConfig.isTestDatabase(client)) {
      throw new Error('Cleanup can only be performed on test databases');
    }
    
    try {
      // Clean up in reverse dependency order
      const tables = [
        'payments',
        'permission_slips',
        'trips',
        'experiences',
        'venues',
        'profiles',
      ];
      
      for (const table of tables) {
        if (testIds.length > 0) {
          // Clean up specific test records
          await client.from(table).delete().in('id', testIds);
        } else {
          // Clean up all test records (be very careful!)
          const { data } = await client.from(table).select('id').like('id', 'test-%');
          if (data && data.length > 0) {
            const ids = data.map(record => record.id);
            await client.from(table).delete().in('id', ids);
          }
        }
      }
    } catch (error) {
      console.warn('Error during test data cleanup:', error);
    }
  },
  
  // Create test user
  createTestUser: async (
    client: SupabaseClient,
    userData: {
      email: string;
      password: string;
      role?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    const { data, error } = await client.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          role: userData.role || 'teacher',
          ...userData.metadata,
        },
      },
    });
    
    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }
    
    return data.user;
  },
  
  // Sign in test user
  signInTestUser: async (
    client: SupabaseClient,
    credentials: { email: string; password: string }
  ) => {
    const { data, error } = await client.auth.signInWithPassword(credentials);
    
    if (error) {
      throw new Error(`Failed to sign in test user: ${error.message}`);
    }
    
    return data;
  },
  
  // Create test venue
  createTestVenue: async (client: SupabaseClient, venueData: any) => {
    const { data, error } = await client
      .from('venues')
      .insert({
        id: venueData.id || `test-venue-${Date.now()}`,
        name: venueData.name || 'Test Venue',
        description: venueData.description || 'A test venue for automated testing',
        address: venueData.address || '123 Test St, Test City, TC 12345',
        phone: venueData.phone || '+1-555-0123',
        email: venueData.email || 'test@venue.com',
        category: venueData.category || 'museum',
        capacity: venueData.capacity || 100,
        status: 'active',
        ...venueData,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create test venue: ${error.message}`);
    }
    
    return data;
  },
  
  // Create test experience
  createTestExperience: async (client: SupabaseClient, experienceData: any) => {
    const { data, error } = await client
      .from('experiences')
      .insert({
        id: experienceData.id || `test-exp-${Date.now()}`,
        venue_id: experienceData.venue_id,
        title: experienceData.title || 'Test Experience',
        description: experienceData.description || 'A test experience for automated testing',
        duration_minutes: experienceData.duration_minutes || 60,
        max_participants: experienceData.max_participants || 30,
        price_cents: experienceData.price_cents || 1500,
        age_range_min: experienceData.age_range_min || 8,
        age_range_max: experienceData.age_range_max || 18,
        status: 'active',
        ...experienceData,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create test experience: ${error.message}`);
    }
    
    return data;
  },
  
  // Create test trip
  createTestTrip: async (client: SupabaseClient, tripData: any) => {
    const { data, error } = await client
      .from('trips')
      .insert({
        id: tripData.id || `test-trip-${Date.now()}`,
        title: tripData.title || 'Test Trip',
        description: tripData.description || 'A test trip for automated testing',
        venue_id: tripData.venue_id,
        experience_id: tripData.experience_id,
        teacher_id: tripData.teacher_id,
        school_id: tripData.school_id,
        trip_date: tripData.trip_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        departure_time: tripData.departure_time || '09:00:00',
        return_time: tripData.return_time || '15:00:00',
        estimated_cost_cents: tripData.estimated_cost_cents || 1500,
        max_participants: tripData.max_participants || 25,
        grade_level: tripData.grade_level || '5',
        status: 'draft',
        ...tripData,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create test trip: ${error.message}`);
    }
    
    return data;
  },
  
  // Create test permission slip
  createTestPermissionSlip: async (client: SupabaseClient, slipData: any) => {
    const { data, error } = await client
      .from('permission_slips')
      .insert({
        id: slipData.id || `test-slip-${Date.now()}`,
        trip_id: slipData.trip_id,
        student_name: slipData.student_name || 'Test Student',
        student_grade: slipData.student_grade || '5',
        student_dob: slipData.student_dob || '2014-01-01',
        parent_name: slipData.parent_name || 'Test Parent',
        parent_email: slipData.parent_email || 'parent@test.com',
        parent_phone: slipData.parent_phone || '+1-555-0123',
        emergency_contact_name: slipData.emergency_contact_name || 'Emergency Contact',
        emergency_contact_phone: slipData.emergency_contact_phone || '+1-555-0124',
        emergency_contact_relationship: slipData.emergency_contact_relationship || 'Guardian',
        status: 'pending',
        magic_link_token: slipData.magic_link_token || `test-token-${Date.now()}`,
        magic_link_expires_at: slipData.magic_link_expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ...slipData,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create test permission slip: ${error.message}`);
    }
    
    return data;
  },
  
  // Create complete test scenario
  createTestScenario: async (
    client: SupabaseClient,
    scenario: {
      venue?: any;
      experience?: any;
      trip?: any;
      permissionSlip?: any;
      user?: { email: string; password: string; role?: string };
    } = {}
  ) => {
    const testIds: string[] = [];
    
    try {
      // Create test user if specified
      let user = null;
      if (scenario.user) {
        user = await testDataManager.createTestUser(client, scenario.user);
        if (user?.id) testIds.push(user.id);
      }
      
      // Create test venue
      const venue = await testDataManager.createTestVenue(client, scenario.venue || {});
      testIds.push(venue.id);
      
      // Create test experience
      const experience = await testDataManager.createTestExperience(client, {
        venue_id: venue.id,
        ...scenario.experience,
      });
      testIds.push(experience.id);
      
      // Create test trip
      const trip = await testDataManager.createTestTrip(client, {
        venue_id: venue.id,
        experience_id: experience.id,
        teacher_id: user?.id || 'test-teacher-123',
        school_id: 'test-school-123',
        ...scenario.trip,
      });
      testIds.push(trip.id);
      
      // Create test permission slip if specified
      let permissionSlip = null;
      if (scenario.permissionSlip !== false) {
        permissionSlip = await testDataManager.createTestPermissionSlip(client, {
          trip_id: trip.id,
          ...scenario.permissionSlip,
        });
        testIds.push(permissionSlip.id);
      }
      
      return {
        user,
        venue,
        experience,
        trip,
        permissionSlip,
        testIds,
        cleanup: () => testDataManager.cleanupTestData(client, testIds),
      };
    } catch (error) {
      // Clean up any created records on error
      await testDataManager.cleanupTestData(client, testIds);
      throw error;
    }
  },
};

// Test database hooks
export const testDatabaseHooks = {
  // Setup hook for tests that need database
  setupTestDatabase: async () => {
    const client = testDatabaseConfig.createTestClient();
    
    // Verify connection
    const isConnected = await testDatabaseConfig.verifyConnection(client);
    if (!isConnected) {
      throw new Error('Failed to connect to test database');
    }
    
    // Verify it's a test database
    if (!testDatabaseConfig.isTestDatabase(client)) {
      throw new Error('Not connected to a test database. Refusing to run tests against production data.');
    }
    
    return client;
  },
  
  // Teardown hook for cleaning up after tests
  teardownTestDatabase: async (client: SupabaseClient, testIds?: string[]) => {
    try {
      await testDataManager.cleanupTestData(client, testIds);
    } catch (error) {
      console.warn('Error during test database teardown:', error);
    }
  },
  
  // Transaction-like test isolation
  withTestTransaction: async <T>(
    client: SupabaseClient,
    testFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> => {
    const testIds: string[] = [];
    
    try {
      // Run the test
      const result = await testFn(client);
      return result;
    } finally {
      // Always clean up, even if test fails
      await testDataManager.cleanupTestData(client, testIds);
    }
  },
};

// Test environment validation
export const testEnvironment = {
  // Validate test environment setup
  validateTestEnvironment: () => {
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ];
    
    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required test environment variables: ${missingVars.join(', ')}\n` +
        'Please ensure your test environment is properly configured.'
      );
    }
    
    // Warn if not using test-specific environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('test') && !supabaseUrl.includes('staging')) {
      console.warn(
        'WARNING: Tests may be running against a non-test database. ' +
        'Please ensure you are using a test or staging environment.'
      );
    }
  },
  
  // Check if running in CI environment
  isCI: () => {
    return !!(
      process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.JENKINS_URL
    );
  },
  
  // Get test environment info
  getTestEnvironmentInfo: () => ({
    nodeEnv: process.env.NODE_ENV,
    isCI: testEnvironment.isCI(),
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    hasTestDatabase: !!(process.env.TEST_SUPABASE_URL),
  }),
};