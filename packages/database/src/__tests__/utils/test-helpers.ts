import { supabase } from '../../index';
import type { Database } from '../../types';

type Venue = Database['public']['Tables']['venues']['Insert'];
type Teacher = Database['public']['Tables']['teachers']['Insert'];
type Trip = Database['public']['Tables']['trips']['Insert'];
type School = Database['public']['Tables']['schools']['Insert'];

export const createTestVenue = async (overrides?: Partial<Venue>) => {
  const venue: Venue = {
    name: 'Test Venue',
    description: 'A test venue for automated testing',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip_code: '12345',
    contact_email: 'venue@test.com',
    contact_phone: '555-0100',
    ...overrides,
  };

  const { data, error } = await supabase
    .from('venues')
    .insert(venue)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createTestSchool = async (overrides?: Partial<School>) => {
  const school: School = {
    name: 'Test School',
    district: 'Test District',
    address: '456 School Ave',
    city: 'Test City',
    state: 'TS',
    zip_code: '12345',
    contact_email: 'school@test.com',
    contact_phone: '555-0200',
    ...overrides,
  };

  const { data, error } = await supabase
    .from('schools')
    .insert(school)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createTestTeacher = async (schoolId: string, overrides?: Partial<Teacher>) => {
  const teacher: Teacher = {
    school_id: schoolId,
    name: 'Test Teacher',
    email: `teacher-${Date.now()}@test.com`,
    phone: '555-0300',
    ...overrides,
  };

  const { data, error } = await supabase
    .from('teachers')
    .insert(teacher)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createTestTrip = async (
  teacherId: string,
  schoolId: string,
  venueId: string,
  experienceId: string,
  overrides?: Partial<Trip>
) => {
  const trip: Trip = {
    teacher_id: teacherId,
    school_id: schoolId,
    venue_id: venueId,
    experience_id: experienceId,
    name: 'Test Trip',
    trip_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    student_count: 25,
    total_cost: 50000,
    status: 'draft',
    ...overrides,
  };

  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const cleanupTestData = async () => {
  try {
    await supabase.from('permission_slips').delete().ilike('student_name', 'Test%');
    await supabase.from('trips').delete().ilike('name', 'Test%');
    await supabase.from('teachers').delete().ilike('email', '%@test.com');
    await supabase.from('schools').delete().ilike('name', 'Test%');
    await supabase.from('venues').delete().ilike('name', 'Test%');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};

export const createTestStudent = (overrides?: Partial<{ name: string; grade: number }>) => ({
  name: 'Test Student',
  grade: 5,
  ...overrides,
});

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
