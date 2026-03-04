/**
 * Database fixtures for consistent test data
 * Provides realistic test data for all TripSlip entities
 */

import type { Database } from '@tripslip/database';

type Tables = Database['public']['Tables'];

// User and Profile fixtures
export const userFixtures = {
  teacher: {
    id: 'teacher-123',
    email: 'jane.teacher@school.edu',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  parent: {
    id: 'parent-123',
    email: 'john.parent@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  venueAdmin: {
    id: 'venue-admin-123',
    email: 'sarah.admin@museum.org',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  schoolAdmin: {
    id: 'school-admin-123',
    email: 'mike.admin@school.edu',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

export const profileFixtures = {
  teacher: {
    id: 'teacher-123',
    full_name: 'Jane Teacher',
    phone: '+1-555-0123',
    role: 'teacher' as const,
    school_id: 'school-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  parent: {
    id: 'parent-123',
    full_name: 'John Parent',
    phone: '+1-555-0456',
    role: 'parent' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  venueAdmin: {
    id: 'venue-admin-123',
    full_name: 'Sarah Venue Admin',
    phone: '+1-555-0789',
    role: 'venue_admin' as const,
    venue_id: 'venue-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  schoolAdmin: {
    id: 'school-admin-123',
    full_name: 'Mike School Admin',
    phone: '+1-555-0321',
    role: 'school_admin' as const,
    school_id: 'school-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// School fixtures
export const schoolFixtures = {
  elementary: {
    id: 'school-123',
    name: 'Riverside Elementary School',
    district: 'Riverside School District',
    address: '123 School St, Riverside, CA 92501',
    phone: '+1-951-555-0100',
    email: 'info@riverside-elementary.edu',
    principal_name: 'Dr. Emily Johnson',
    student_count: 450,
    grade_levels: ['K', '1', '2', '3', '4', '5'],
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  middle: {
    id: 'school-456',
    name: 'Lincoln Middle School',
    district: 'Lincoln Unified School District',
    address: '456 Education Ave, Lincoln, CA 95648',
    phone: '+1-916-555-0200',
    email: 'info@lincoln-middle.edu',
    principal_name: 'Mr. Robert Chen',
    student_count: 800,
    grade_levels: ['6', '7', '8'],
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  high: {
    id: 'school-789',
    name: 'Washington High School',
    district: 'Washington Union High School District',
    address: '789 Learning Blvd, Washington, CA 95076',
    phone: '+1-408-555-0300',
    email: 'info@washington-high.edu',
    principal_name: 'Ms. Maria Rodriguez',
    student_count: 1200,
    grade_levels: ['9', '10', '11', '12'],
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// Venue fixtures
export const venueFixtures = {
  museum: {
    id: 'venue-123',
    name: 'California Science Museum',
    description: 'Interactive science museum with hands-on exhibits covering physics, chemistry, biology, and space exploration.',
    address: '700 Exposition Park Dr, Los Angeles, CA 90037',
    phone: '+1-213-555-0400',
    email: 'education@californiascience.org',
    website: 'https://californiascience.org',
    category: 'museum' as const,
    subcategory: 'science',
    capacity: 200,
    parking_available: true,
    wheelchair_accessible: true,
    food_service_available: true,
    gift_shop_available: true,
    indoor_facility: true,
    outdoor_facility: false,
    age_range_min: 5,
    age_range_max: 18,
    operating_hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { open: '10:00', close: '18:00' },
    },
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  zoo: {
    id: 'venue-456',
    name: 'Riverside Zoo & Botanical Gardens',
    description: 'Family-friendly zoo featuring over 300 animal species and beautiful botanical gardens.',
    address: '3400 Block Dr, Riverside, CA 92506',
    phone: '+1-951-555-0500',
    email: 'education@riversidezoo.org',
    website: 'https://riversidezoo.org',
    category: 'zoo' as const,
    subcategory: 'wildlife',
    capacity: 500,
    parking_available: true,
    wheelchair_accessible: true,
    food_service_available: true,
    gift_shop_available: true,
    indoor_facility: false,
    outdoor_facility: true,
    age_range_min: 3,
    age_range_max: 18,
    operating_hours: {
      monday: { open: '09:00', close: '16:00' },
      tuesday: { open: '09:00', close: '16:00' },
      wednesday: { open: '09:00', close: '16:00' },
      thursday: { open: '09:00', close: '16:00' },
      friday: { open: '09:00', close: '16:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: '09:00', close: '17:00' },
    },
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  aquarium: {
    id: 'venue-789',
    name: 'Pacific Marine Aquarium',
    description: 'World-class aquarium showcasing marine life from the Pacific Ocean and beyond.',
    address: '100 Aquarium Way, Long Beach, CA 90802',
    phone: '+1-562-555-0600',
    email: 'groups@pacificmarine.org',
    website: 'https://pacificmarine.org',
    category: 'aquarium' as const,
    subcategory: 'marine',
    capacity: 300,
    parking_available: true,
    wheelchair_accessible: true,
    food_service_available: true,
    gift_shop_available: true,
    indoor_facility: true,
    outdoor_facility: false,
    age_range_min: 4,
    age_range_max: 18,
    operating_hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '09:00', close: '20:00' },
      sunday: { open: '09:00', close: '18:00' },
    },
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// Experience fixtures
export const experienceFixtures = {
  dinosaurTour: {
    id: 'exp-123',
    venue_id: 'venue-123',
    title: 'Dinosaur Discovery Tour',
    description: 'Interactive guided tour through our paleontology exhibits featuring life-size dinosaur models and fossil displays.',
    duration_minutes: 90,
    max_participants: 30,
    price_cents: 1500, // $15.00
    age_range_min: 8,
    age_range_max: 18,
    learning_objectives: [
      'Understand dinosaur evolution and extinction',
      'Learn about fossil formation and discovery',
      'Explore paleontology as a career',
    ],
    curriculum_standards: ['NGSS 5-LS2-1', 'NGSS MS-LS4-1'],
    materials_provided: ['Activity worksheets', 'Fossil replicas for handling'],
    requirements: ['Closed-toe shoes required', 'Adult supervision needed'],
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  spaceExploration: {
    id: 'exp-456',
    venue_id: 'venue-123',
    title: 'Space Exploration Workshop',
    description: 'Hands-on workshop exploring space science, rocket design, and planetary exploration.',
    duration_minutes: 120,
    max_participants: 25,
    price_cents: 2000, // $20.00
    age_range_min: 10,
    age_range_max: 18,
    learning_objectives: [
      'Understand principles of rocket propulsion',
      'Learn about planetary characteristics',
      'Explore careers in aerospace',
    ],
    curriculum_standards: ['NGSS 5-ESS1-1', 'NGSS MS-ETS1-2'],
    materials_provided: ['Rocket building kits', 'Planetary fact sheets'],
    requirements: ['Safety goggles provided', 'Outdoor launch area'],
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  animalEncounter: {
    id: 'exp-789',
    venue_id: 'venue-456',
    title: 'Animal Ambassador Encounter',
    description: 'Up-close educational experience with friendly animal ambassadors and their zookeeper handlers.',
    duration_minutes: 60,
    max_participants: 40,
    price_cents: 1200, // $12.00
    age_range_min: 5,
    age_range_max: 18,
    learning_objectives: [
      'Learn about animal adaptations',
      'Understand conservation efforts',
      'Explore animal behavior',
    ],
    curriculum_standards: ['NGSS K-LS1-1', 'NGSS 3-LS4-3'],
    materials_provided: ['Animal fact cards', 'Conservation activity sheets'],
    requirements: ['Hand sanitizer provided', 'No flash photography'],
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// Trip fixtures
export const tripFixtures = {
  scienceMuseumTrip: {
    id: 'trip-123',
    title: 'Science Museum Field Trip',
    description: 'Educational visit to explore dinosaur exhibits and participate in space workshop.',
    venue_id: 'venue-123',
    experience_id: 'exp-123',
    teacher_id: 'teacher-123',
    school_id: 'school-123',
    trip_date: '2024-06-15',
    departure_time: '08:30:00',
    return_time: '15:00:00',
    estimated_cost_cents: 1500,
    max_participants: 25,
    current_participants: 0,
    grade_level: '5',
    subject_area: 'Science',
    learning_objectives: [
      'Understand dinosaur evolution',
      'Learn about space exploration',
      'Practice scientific observation',
    ],
    special_requirements: 'Students must wear closed-toe shoes',
    transportation_method: 'School bus',
    lunch_arrangement: 'Packed lunch from school',
    emergency_contact: 'Jane Teacher - +1-555-0123',
    status: 'draft' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  zooTrip: {
    id: 'trip-456',
    title: 'Zoo Animal Study Trip',
    description: 'Biology field trip to study animal adaptations and conservation.',
    venue_id: 'venue-456',
    experience_id: 'exp-789',
    teacher_id: 'teacher-123',
    school_id: 'school-123',
    trip_date: '2024-07-20',
    departure_time: '09:00:00',
    return_time: '14:30:00',
    estimated_cost_cents: 1200,
    max_participants: 30,
    current_participants: 0,
    grade_level: '7',
    subject_area: 'Biology',
    learning_objectives: [
      'Observe animal behaviors',
      'Understand conservation efforts',
      'Study habitat requirements',
    ],
    special_requirements: 'Bring water bottles and sun hats',
    transportation_method: 'Charter bus',
    lunch_arrangement: 'Cafeteria lunch at venue',
    emergency_contact: 'Jane Teacher - +1-555-0123',
    status: 'published' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// Permission slip fixtures
export const permissionSlipFixtures = {
  pending: {
    id: 'slip-123',
    trip_id: 'trip-123',
    student_name: 'Emma Johnson',
    student_grade: '5',
    student_dob: '2014-03-15',
    parent_name: 'Jennifer Johnson',
    parent_email: 'jennifer.johnson@example.com',
    parent_phone: '+1-555-0789',
    emergency_contact_name: 'Michael Johnson',
    emergency_contact_phone: '+1-555-0790',
    emergency_contact_relationship: 'Father',
    medical_conditions: 'Mild peanut allergy',
    medications: 'EpiPen (carried by student)',
    dietary_restrictions: 'No peanuts or tree nuts',
    photo_permission: true,
    pickup_permission: true,
    special_instructions: 'Please ensure student has EpiPen at all times',
    status: 'pending' as const,
    magic_link_token: 'abc123def456',
    magic_link_expires_at: '2024-06-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  signed: {
    id: 'slip-456',
    trip_id: 'trip-456',
    student_name: 'Marcus Chen',
    student_grade: '7',
    student_dob: '2012-08-22',
    parent_name: 'Lisa Chen',
    parent_email: 'lisa.chen@example.com',
    parent_phone: '+1-555-0891',
    emergency_contact_name: 'David Chen',
    emergency_contact_phone: '+1-555-0892',
    emergency_contact_relationship: 'Father',
    medical_conditions: 'None',
    medications: 'None',
    dietary_restrictions: 'Vegetarian',
    photo_permission: true,
    pickup_permission: false,
    special_instructions: 'Student will be picked up by grandmother',
    signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    signed_at: '2024-01-15T10:30:00Z',
    status: 'signed' as const,
    magic_link_token: 'xyz789abc123',
    magic_link_expires_at: '2024-07-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
};

// Payment fixtures
export const paymentFixtures = {
  pending: {
    id: 'payment-123',
    permission_slip_id: 'slip-123',
    stripe_payment_intent_id: 'pi_test_123',
    amount_cents: 1500,
    currency: 'usd',
    status: 'pending' as const,
    payment_method: 'card',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  succeeded: {
    id: 'payment-456',
    permission_slip_id: 'slip-456',
    stripe_payment_intent_id: 'pi_test_456',
    amount_cents: 1200,
    currency: 'usd',
    status: 'succeeded' as const,
    payment_method: 'card',
    paid_at: '2024-01-15T11:00:00Z',
    receipt_url: 'https://pay.stripe.com/receipts/test_receipt_456',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  },
  
  failed: {
    id: 'payment-789',
    permission_slip_id: 'slip-789',
    stripe_payment_intent_id: 'pi_test_789',
    amount_cents: 1800,
    currency: 'usd',
    status: 'failed' as const,
    payment_method: 'card',
    failure_reason: 'card_declined',
    failure_message: 'Your card was declined.',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
  },
};

// Helper functions to create variations of fixtures
export const createUserFixture = (overrides: any = {}) => ({
  ...userFixtures.teacher,
  ...overrides,
});

export const createVenueFixture = (overrides: any = {}) => ({
  ...venueFixtures.museum,
  ...overrides,
});

export const createExperienceFixture = (overrides: any = {}) => ({
  ...experienceFixtures.dinosaurTour,
  ...overrides,
});

export const createTripFixture = (overrides: any = {}) => ({
  ...tripFixtures.scienceMuseumTrip,
  ...overrides,
});

export const createPermissionSlipFixture = (overrides: any = {}) => ({
  ...permissionSlipFixtures.pending,
  ...overrides,
});

export const createPaymentFixture = (overrides: any = {}) => ({
  ...paymentFixtures.pending,
  ...overrides,
});