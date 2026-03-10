import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const PASSWORD = 'TripSlip2026!';

const JA_VENUE_ID = 'aa000000-0000-0000-0000-000000000001';

const JA_VENUE = {
  id: JA_VENUE_ID,
  name: 'JA Finance Park',
  description: 'JA Finance Park is Junior Achievement\'s flagship experiential learning facility where students step into a realistic simulated city to practice real-world financial decision-making. Through immersive role-play, students manage personal budgets, make spending decisions on housing, transportation, food, and insurance, and learn the fundamentals of financial literacy that will serve them for life. Our 10,000+ square foot facility features life-sized storefronts including a bank, insurance office, retail shops, and a housing center — all designed to give students hands-on experience with money management, career planning, and civic responsibility.',
  address: {
    street: '651 W Washington Blvd',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60661',
    country: 'USA',
    coordinates: { lat: 41.8825, lng: -87.6441 }
  },
  contact_email: 'financepark@jachicago.org',
  contact_phone: '(312) 715-1300',
  website: 'https://jachicago.org',
  capacity_min: 20,
  capacity_max: 150,
  rating: 4.8,
  review_count: 247,
  verified: true,
  claimed: true,
  booking_lead_time_days: 21,
  supported_age_groups: ['elementary', 'middle-school', 'high-school'],
  operating_hours: [
    { day: 'Monday', open: '08:00', close: '16:00' },
    { day: 'Tuesday', open: '08:00', close: '16:00' },
    { day: 'Wednesday', open: '08:00', close: '16:00' },
    { day: 'Thursday', open: '08:00', close: '16:00' },
    { day: 'Friday', open: '08:00', close: '15:00' },
  ],
  accessibility_features: {
    wheelchair_accessible: true,
    elevator: true,
    accessible_restrooms: true,
    hearing_loop: true,
    braille_signage: true,
    service_animals_welcome: true,
  },
  profile_completeness: 95,
  source: 'platform',
};

const EXPERIENCES = [
  {
    id: 'aa100000-0000-0000-0000-000000000001',
    venue_id: JA_VENUE_ID,
    title: 'JA Finance Park — Entry Level',
    description: 'Students take on a simulated adult identity and navigate a realistic community making financial decisions about housing, transportation, food, clothing, and more. Through this immersive 4-hour experience, middle school students learn to create and manage a personal budget, understand the difference between needs and wants, explore career options, and practice critical thinking about money. Aligned with Common Core math and social studies standards. Includes pre-visit classroom curriculum (12 teacher-led sessions) and a follow-up reflection session.',
    duration_minutes: 240,
    capacity: 120,
    min_students: 20,
    max_students: 120,
    grade_levels: ['6th', '7th', '8th', '9th'],
    subjects: ['Financial Literacy', 'Mathematics', 'Social Studies', 'Career Readiness'],
    educational_objectives: [
      'Create and manage a personal budget based on a simulated adult identity',
      'Distinguish between needs and wants when making spending decisions',
      'Understand the impact of taxes, insurance, and credit on personal finances',
      'Explore career pathways and their relationship to income and lifestyle',
      'Practice critical thinking and decision-making with real-world financial scenarios',
    ],
    published: true,
    active: true,
    recommended_age_min: 11,
    recommended_age_max: 15,
    special_requirements: 'Students should complete 12 pre-visit classroom sessions before the field trip. Teachers receive curriculum materials 6 weeks in advance.',
    cancellation_policy: {
      fullRefundDays: 21,
      partialRefundDays: 14,
      partialRefundPercent: 50,
      noRefundAfterDays: 7,
    },
  },
  {
    id: 'aa100000-0000-0000-0000-000000000002',
    venue_id: JA_VENUE_ID,
    title: 'JA Finance Park — Advanced',
    description: 'The advanced Finance Park experience challenges high school students to think critically about long-term financial planning. Students select career and education pathways, define future lifestyle goals, and create comprehensive budgets that account for student loans, retirement savings, investments, and emergency funds. This simulation goes beyond basic budgeting to explore the financial consequences of major life decisions. Students leave with a personalized financial plan they can reference as they transition into adulthood.',
    duration_minutes: 300,
    capacity: 100,
    min_students: 20,
    max_students: 100,
    grade_levels: ['9th', '10th', '11th', '12th'],
    subjects: ['Financial Literacy', 'Economics', 'Mathematics', 'Career Planning'],
    educational_objectives: [
      'Select and evaluate career and education pathways based on personal interests and goals',
      'Create a comprehensive long-term financial plan including savings, investments, and debt management',
      'Analyze the financial impact of major life decisions (education, housing, family planning)',
      'Understand compound interest, credit scores, and their long-term financial effects',
      'Develop a personalized post-graduation financial strategy',
    ],
    published: true,
    active: true,
    recommended_age_min: 14,
    recommended_age_max: 18,
    special_requirements: 'Recommended background in basic personal finance. Pre-visit curriculum (8 sessions) provided to teachers. Students should bring a calculator or smartphone.',
    cancellation_policy: {
      fullRefundDays: 21,
      partialRefundDays: 14,
      partialRefundPercent: 50,
      noRefundAfterDays: 7,
    },
  },
  {
    id: 'aa100000-0000-0000-0000-000000000003',
    venue_id: JA_VENUE_ID,
    title: 'JA BizTown',
    description: 'JA BizTown transforms 4th-6th graders into business owners, bankers, and citizens of a miniature working town. Students operate life-sized businesses, earn paychecks, write checks, manage bank accounts, vote for mayor, and are challenged to earn a profit for their business — all within a 5-hour immersive simulation. This experience brings economics and civics to life through hands-on entrepreneurship. Students develop teamwork, leadership, and financial skills they\'ll use for the rest of their lives.',
    duration_minutes: 300,
    capacity: 100,
    min_students: 25,
    max_students: 100,
    grade_levels: ['4th', '5th', '6th'],
    subjects: ['Economics', 'Civics', 'Entrepreneurship', 'Financial Literacy', 'Mathematics'],
    educational_objectives: [
      'Understand the free enterprise system and how businesses operate',
      'Practice money management through earning, saving, and spending',
      'Develop civic responsibility through voting and community participation',
      'Build teamwork and leadership skills in a business environment',
      'Apply math skills to real-world business scenarios (profit/loss, pricing, payroll)',
    ],
    published: true,
    active: true,
    recommended_age_min: 9,
    recommended_age_max: 12,
    special_requirements: '12 teacher-led classroom sessions must be completed before the visit. JA provides trained volunteers to support the simulation day. Each student receives a role card with their business assignment upon arrival.',
    cancellation_policy: {
      fullRefundDays: 21,
      partialRefundDays: 14,
      partialRefundPercent: 50,
      noRefundAfterDays: 7,
    },
  },
  {
    id: 'aa100000-0000-0000-0000-000000000004',
    venue_id: JA_VENUE_ID,
    title: 'JA Career Speaker Series',
    description: 'Local business professionals visit your school to share real-world career insights with students. This 90-minute interactive session features 3-4 professionals from diverse industries (finance, healthcare, technology, trades) who share their career journeys, daily responsibilities, and advice for students. Includes Q&A, a career exploration worksheet, and take-home resources. Perfect as a standalone event or complement to JA curriculum programs.',
    duration_minutes: 90,
    capacity: 200,
    min_students: 15,
    max_students: 200,
    grade_levels: ['6th', '7th', '8th', '9th', '10th', '11th', '12th'],
    subjects: ['Career Readiness', 'Life Skills'],
    educational_objectives: [
      'Explore diverse career pathways and required education/training',
      'Understand the connection between education choices and career opportunities',
      'Develop questions and interview skills through Q&A with professionals',
      'Identify personal interests and strengths that align with career options',
    ],
    published: true,
    active: true,
    recommended_age_min: 11,
    recommended_age_max: 18,
    special_requirements: 'This is an outreach program — JA speakers come to your school. Requires a classroom or auditorium with projector/screen. Schedule at least 3 weeks in advance for speaker coordination.',
    cancellation_policy: {
      fullRefundDays: 14,
      partialRefundDays: 7,
      partialRefundPercent: 50,
      noRefundAfterDays: 3,
    },
  },
];

const PRICING_TIERS = [
  { experience_id: EXPERIENCES[0].id, min_students: 20, max_students: 40, price_cents: 1500, free_chaperones: 4 },
  { experience_id: EXPERIENCES[0].id, min_students: 41, max_students: 80, price_cents: 1200, free_chaperones: 6 },
  { experience_id: EXPERIENCES[0].id, min_students: 81, max_students: 120, price_cents: 1000, free_chaperones: 8 },
  { experience_id: EXPERIENCES[1].id, min_students: 20, max_students: 40, price_cents: 1800, free_chaperones: 3 },
  { experience_id: EXPERIENCES[1].id, min_students: 41, max_students: 70, price_cents: 1500, free_chaperones: 5 },
  { experience_id: EXPERIENCES[1].id, min_students: 71, max_students: 100, price_cents: 1200, free_chaperones: 7 },
  { experience_id: EXPERIENCES[2].id, min_students: 25, max_students: 50, price_cents: 1400, free_chaperones: 5 },
  { experience_id: EXPERIENCES[2].id, min_students: 51, max_students: 100, price_cents: 1100, free_chaperones: 8 },
  { experience_id: EXPERIENCES[3].id, min_students: 15, max_students: 50, price_cents: 500, free_chaperones: 2 },
  { experience_id: EXPERIENCES[3].id, min_students: 51, max_students: 200, price_cents: 400, free_chaperones: 4 },
];

const JA_ADMIN = {
  email: 'sarah.mitchell@jachicago.org',
  firstName: 'Sarah',
  lastName: 'Mitchell',
};

const JA_TEAM = [
  { email: 'marcus.rivera@jachicago.org', firstName: 'Marcus', lastName: 'Rivera', role: 'administrator' },
  { email: 'aisha.johnson@jachicago.org', firstName: 'Aisha', lastName: 'Johnson', role: 'editor' },
];

async function ensureAuthUser(email, firstName, lastName) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find(u => u.email === email);
  if (found) {
    console.log(`    Auth user exists: ${email} (${found.id.substring(0, 8)})`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (error) {
    console.error(`    ERROR creating auth user ${email}:`, error.message);
    return null;
  }
  console.log(`    Created auth user: ${email} (${data.user.id.substring(0, 8)})`);
  return data.user.id;
}

async function seed() {
  console.log('=== JA Finance Park Demo Seeding ===\n');

  console.log('1. Creating JA Finance Park venue...');
  const { error: venueErr } = await supabase.from('venues').upsert(JA_VENUE, { onConflict: 'id' });
  if (venueErr) {
    console.error('   ERROR:', venueErr.message);
    return;
  }
  console.log('   ✓ JA Finance Park created');

  console.log('\n2. Creating experiences...');
  for (const exp of EXPERIENCES) {
    const { error } = await supabase.from('experiences').upsert(exp, { onConflict: 'id' });
    if (error) console.error(`   ERROR ${exp.title}:`, error.message);
    else console.log(`   ✓ ${exp.title}`);
  }

  console.log('\n3. Creating pricing tiers...');
  for (const exp of EXPERIENCES) {
    await supabase.from('pricing_tiers').delete().eq('experience_id', exp.id);
  }
  for (const tier of PRICING_TIERS) {
    const { error } = await supabase.from('pricing_tiers').insert({
      id: randomUUID(),
      ...tier,
    });
    const exp = EXPERIENCES.find(e => e.id === tier.experience_id);
    if (error) console.error(`   ERROR tier for ${exp?.title}:`, error.message);
    else console.log(`   ✓ ${exp?.title}: ${tier.min_students}-${tier.max_students} students @ $${(tier.price_cents / 100).toFixed(2)}`);
  }

  console.log('\n4. Creating JA admin user...');
  const adminUserId = await ensureAuthUser(JA_ADMIN.email, JA_ADMIN.firstName, JA_ADMIN.lastName);
  if (!adminUserId) {
    console.error('   Failed to create admin user, aborting');
    return;
  }

  await supabase.from('venues').update({ claimed_by: adminUserId }).eq('id', JA_VENUE_ID);

  const { data: existingVU } = await supabase.from('venue_users')
    .select('id').eq('user_id', adminUserId).eq('venue_id', JA_VENUE_ID).limit(1);
  if (!existingVU?.length) {
    const { error } = await supabase.from('venue_users').insert({
      venue_id: JA_VENUE_ID,
      user_id: adminUserId,
      role: 'administrator',
    });
    if (error) console.error('   ERROR linking admin:', error.message);
    else console.log(`   ✓ Sarah Mitchell → JA Finance Park (administrator)`);
  } else {
    console.log('   Admin user already linked');
  }

  console.log('\n5. Creating JA team members...');
  for (const member of JA_TEAM) {
    const userId = await ensureAuthUser(member.email, member.firstName, member.lastName);
    if (!userId) continue;

    const { data: existing } = await supabase.from('venue_users')
      .select('id').eq('user_id', userId).eq('venue_id', JA_VENUE_ID).limit(1);
    if (!existing?.length) {
      const { error } = await supabase.from('venue_users').insert({
        venue_id: JA_VENUE_ID,
        user_id: userId,
        role: member.role,
        invited_by: adminUserId,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      });
      if (error) console.error(`   ERROR ${member.firstName}:`, error.message);
      else console.log(`   ✓ ${member.firstName} ${member.lastName} → ${member.role}`);
    } else {
      console.log(`   Team member exists: ${member.firstName} ${member.lastName}`);
    }
  }

  console.log('\n6. Creating demo trips and bookings...');

  const { data: teachers } = await supabase.from('teachers')
    .select('id, first_name, last_name, email, school_id')
    .limit(4);

  if (!teachers?.length) {
    console.log('   No teachers found — skipping trips. Run seed-demo-scenarios.mjs first.');
  } else {
    const tripData = [
      {
        id: 'aa200000-0000-0000-0000-000000000001',
        experience_id: EXPERIENCES[0].id,
        teacher_id: teachers[0].id,
        trip_date: '2026-04-15',
        trip_time: '09:00:00',
        student_count: 28,
        status: 'confirmed',
        is_free: false,
        funding_model: 'school_funded',
        direct_link_token: 'ja-fp-entry-' + randomUUID().substring(0, 8),
        transportation: { type: 'school_bus', bus_count: 1, departure_time: '08:00', pickup_location: 'School front entrance' },
      },
      {
        id: 'aa200000-0000-0000-0000-000000000002',
        experience_id: EXPERIENCES[2].id,
        teacher_id: teachers.length > 1 ? teachers[1].id : teachers[0].id,
        trip_date: '2026-04-22',
        trip_time: '09:30:00',
        student_count: 32,
        status: 'confirmed',
        is_free: false,
        funding_model: 'parent_pay',
        direct_link_token: 'ja-biztown-' + randomUUID().substring(0, 8),
        transportation: { type: 'charter_bus', bus_count: 1, departure_time: '08:15', pickup_location: 'Main parking lot' },
      },
      {
        id: 'aa200000-0000-0000-0000-000000000003',
        experience_id: EXPERIENCES[1].id,
        teacher_id: teachers.length > 2 ? teachers[2].id : teachers[0].id,
        trip_date: '2026-05-06',
        trip_time: '09:00:00',
        student_count: 25,
        status: 'pending',
        is_free: false,
        funding_model: 'split_funded',
        assistance_fund_cents: 50000,
        direct_link_token: 'ja-fp-adv-' + randomUUID().substring(0, 8),
        transportation: { type: 'school_bus', bus_count: 1, departure_time: '07:45', pickup_location: 'Bus loop' },
      },
      {
        id: 'aa200000-0000-0000-0000-000000000004',
        experience_id: EXPERIENCES[0].id,
        teacher_id: teachers.length > 3 ? teachers[3].id : teachers[0].id,
        trip_date: '2026-05-20',
        trip_time: '10:00:00',
        student_count: 45,
        status: 'pending',
        is_free: false,
        funding_model: 'parent_pay',
        direct_link_token: 'ja-fp-entry2-' + randomUUID().substring(0, 8),
        transportation: { type: 'school_bus', bus_count: 2, departure_time: '08:30', pickup_location: 'South entrance' },
      },
      {
        id: 'aa200000-0000-0000-0000-000000000005',
        experience_id: EXPERIENCES[3].id,
        teacher_id: teachers[0].id,
        trip_date: '2026-03-25',
        trip_time: '13:00:00',
        student_count: 60,
        status: 'completed',
        is_free: true,
        funding_model: 'school_funded',
        direct_link_token: 'ja-career-' + randomUUID().substring(0, 8),
        transportation: { type: 'none', notes: 'Speakers visit school — no transportation needed' },
      },
      {
        id: 'aa200000-0000-0000-0000-000000000006',
        experience_id: EXPERIENCES[0].id,
        teacher_id: teachers.length > 1 ? teachers[1].id : teachers[0].id,
        trip_date: '2026-02-12',
        trip_time: '09:00:00',
        student_count: 30,
        status: 'completed',
        is_free: false,
        funding_model: 'parent_pay',
        direct_link_token: 'ja-fp-past-' + randomUUID().substring(0, 8),
        transportation: { type: 'school_bus', bus_count: 1, departure_time: '08:00', pickup_location: 'Front circle' },
      },
      {
        id: 'aa200000-0000-0000-0000-000000000007',
        experience_id: EXPERIENCES[2].id,
        teacher_id: teachers.length > 2 ? teachers[2].id : teachers[0].id,
        trip_date: '2026-01-28',
        trip_time: '09:30:00',
        student_count: 48,
        status: 'completed',
        is_free: false,
        funding_model: 'school_funded',
        direct_link_token: 'ja-biz-past-' + randomUUID().substring(0, 8),
        transportation: { type: 'charter_bus', bus_count: 1, departure_time: '08:00', pickup_location: 'North lot' },
      },
    ];

    for (const trip of tripData) {
      const { error } = await supabase.from('trips').upsert(trip, { onConflict: 'id' });
      const exp = EXPERIENCES.find(e => e.id === trip.experience_id);
      if (error) console.error(`   ERROR trip ${trip.trip_date}:`, error.message);
      else console.log(`   ✓ Trip: ${exp?.title?.substring(0, 30)}... on ${trip.trip_date} (${trip.status})`);
    }

    console.log('\n7. Creating venue bookings...');
    const bookings = [
      {
        id: 'aa300000-0000-0000-0000-000000000001',
        trip_id: tripData[0].id,
        venue_id: JA_VENUE_ID,
        experience_id: tripData[0].experience_id,
        scheduled_date: tripData[0].trip_date,
        start_time: '09:00:00',
        end_time: '13:00:00',
        student_count: tripData[0].student_count,
        chaperone_count: 4,
        status: 'confirmed',
        confirmation_number: 'JA-FP-2026-0415',
        quoted_price_cents: 28 * 1500,
        paid_cents: 28 * 1500,
        venue_notes: '7th grade group, 28 students. Completed all 12 pre-visit sessions. 4 chaperones confirmed.',
        confirmed_at: '2026-03-15T10:00:00Z',
      },
      {
        id: 'aa300000-0000-0000-0000-000000000002',
        trip_id: tripData[1].id,
        venue_id: JA_VENUE_ID,
        experience_id: tripData[1].experience_id,
        scheduled_date: tripData[1].trip_date,
        start_time: '09:30:00',
        end_time: '14:30:00',
        student_count: tripData[1].student_count,
        chaperone_count: 5,
        status: 'confirmed',
        confirmation_number: 'JA-BT-2026-0422',
        quoted_price_cents: 32 * 1400,
        paid_cents: 0,
        venue_notes: '5th grade BizTown experience. 32 students, 5 chaperones. Pre-visit curriculum complete.',
        confirmed_at: '2026-03-20T14:30:00Z',
      },
      {
        id: 'aa300000-0000-0000-0000-000000000003',
        trip_id: tripData[2].id,
        venue_id: JA_VENUE_ID,
        experience_id: tripData[2].experience_id,
        scheduled_date: tripData[2].trip_date,
        start_time: '09:00:00',
        end_time: '14:00:00',
        student_count: tripData[2].student_count,
        chaperone_count: 3,
        status: 'pending',
        confirmation_number: 'JA-FPA-2026-0506',
        quoted_price_cents: 25 * 1800,
        paid_cents: 0,
        venue_notes: '10th grade Advanced Finance Park. Partial scholarship funding. Awaiting school approval.',
      },
      {
        id: 'aa300000-0000-0000-0000-000000000004',
        trip_id: tripData[3].id,
        venue_id: JA_VENUE_ID,
        experience_id: tripData[3].experience_id,
        scheduled_date: tripData[3].trip_date,
        start_time: '10:00:00',
        end_time: '14:00:00',
        student_count: tripData[3].student_count,
        chaperone_count: 6,
        status: 'pending',
        confirmation_number: 'JA-FP-2026-0520',
        quoted_price_cents: 45 * 1200,
        paid_cents: 0,
        venue_notes: 'Large 8th grade group, 45 students. Requesting AM slot. 6 chaperones needed.',
      },
      {
        id: 'aa300000-0000-0000-0000-000000000005',
        trip_id: tripData[4].id,
        venue_id: JA_VENUE_ID,
        experience_id: tripData[4].experience_id,
        scheduled_date: tripData[4].trip_date,
        start_time: '13:00:00',
        end_time: '14:30:00',
        student_count: tripData[4].student_count,
        chaperone_count: 2,
        status: 'completed',
        confirmation_number: 'JA-CS-2026-0325',
        quoted_price_cents: 0,
        paid_cents: 0,
        venue_notes: 'Free career speaker session at school. 3 speakers from finance, healthcare, and tech.',
        confirmed_at: '2026-03-10T09:00:00Z',
        completed_at: '2026-03-25T14:30:00Z',
      },
      {
        id: 'aa300000-0000-0000-0000-000000000006',
        trip_id: tripData[5].id,
        venue_id: JA_VENUE_ID,
        experience_id: tripData[5].experience_id,
        scheduled_date: tripData[5].trip_date,
        start_time: '09:00:00',
        end_time: '13:00:00',
        student_count: tripData[5].student_count,
        chaperone_count: 4,
        status: 'completed',
        confirmation_number: 'JA-FP-2026-0212',
        quoted_price_cents: 30 * 1500,
        paid_cents: 30 * 1500,
        venue_notes: 'Completed successfully. Teacher feedback: "Students loved it — best field trip of the year!"',
        confirmed_at: '2026-01-20T11:00:00Z',
        completed_at: '2026-02-12T13:00:00Z',
      },
      {
        id: 'aa300000-0000-0000-0000-000000000007',
        trip_id: tripData[6].id,
        venue_id: JA_VENUE_ID,
        experience_id: tripData[6].experience_id,
        scheduled_date: tripData[6].trip_date,
        start_time: '09:30:00',
        end_time: '14:30:00',
        student_count: tripData[6].student_count,
        chaperone_count: 6,
        status: 'completed',
        confirmation_number: 'JA-BT-2026-0128',
        quoted_price_cents: 48 * 1400,
        paid_cents: 48 * 1400,
        venue_notes: 'Large BizTown group. All 21 businesses staffed. Outstanding student engagement.',
        confirmed_at: '2026-01-05T10:00:00Z',
        completed_at: '2026-01-28T14:30:00Z',
      },
    ];

    for (const booking of bookings) {
      const { error } = await supabase.from('venue_bookings').upsert(booking, { onConflict: 'id' });
      if (error) console.error(`   ERROR booking ${booking.confirmation_number}:`, error.message);
      else console.log(`   ✓ Booking ${booking.confirmation_number} (${booking.status})`);
    }

    console.log('\n8. Creating permission slips for completed/confirmed trips...');
    let slipCount = 0;
    const completedAndConfirmedTrips = tripData.filter(t =>
      t.status === 'completed' || t.status === 'confirmed'
    );

    for (const trip of completedAndConfirmedTrips) {
      const { data: existingSlips } = await supabase.from('permission_slips')
        .select('id').eq('trip_id', trip.id).limit(1);
      if (existingSlips?.length) {
        console.log(`   Slips already exist for trip ${trip.trip_date}`);
        continue;
      }

      const { data: roster } = await supabase.from('rosters')
        .select('id').eq('teacher_id', trip.teacher_id).limit(1);
      let studentIds = [];
      if (roster?.length) {
        const { data: students } = await supabase.from('students')
          .select('id').eq('roster_id', roster[0].id).limit(trip.student_count);
        studentIds = students?.map(s => s.id) || [];
      }

      const slipStatus = trip.status === 'completed' ? 'paid' : 'signed';
      const numSlips = Math.min(studentIds.length || trip.student_count, trip.student_count);

      for (let i = 0; i < numSlips; i++) {
        const slipId = randomUUID();
        const { error } = await supabase.from('permission_slips').insert({
          id: slipId,
          trip_id: trip.id,
          student_id: studentIds[i] || null,
          status: slipStatus,
          form_data: {
            parent_name: `Parent ${i + 1}`,
            parent_email: `parent${i + 1}@example.com`,
            parent_phone: `555-${String(1000 + i).padStart(4, '0')}`,
            emergency_contact: `Emergency ${i + 1}`,
            emergency_phone: `555-${String(2000 + i).padStart(4, '0')}`,
            allergies: i % 5 === 0 ? 'None' : i % 5 === 1 ? 'Peanuts' : i % 5 === 2 ? 'Latex' : 'None',
            medical_notes: '',
            consent_photo: true,
            consent_emergency_treatment: true,
          },
          signed_at: new Date(Date.now() - (30 + i) * 24 * 60 * 60 * 1000).toISOString(),
          magic_link_token: randomUUID(),
        });
        if (error) console.error(`   Slip error: ${error.message}`);
        else slipCount++;
      }
    }
    console.log(`   ✓ Created ${slipCount} permission slips`);

    console.log('\n9. Creating payments for paid trips...');
    let paymentCount = 0;
    const paidTrips = tripData.filter(t => t.status === 'completed' && !t.is_free);

    for (const trip of paidTrips) {
      const { data: slips } = await supabase.from('permission_slips')
        .select('id').eq('trip_id', trip.id);

      if (!slips?.length) continue;

      const exp = EXPERIENCES.find(e => e.id === trip.experience_id);
      const tier = PRICING_TIERS.find(pt =>
        pt.experience_id === trip.experience_id &&
        trip.student_count >= pt.min_students &&
        trip.student_count <= pt.max_students
      );
      const pricePerStudent = tier?.price_cents || 1500;

      for (const slip of slips) {
        const { data: existingPayment } = await supabase.from('payments')
          .select('id').eq('permission_slip_id', slip.id).limit(1);
        if (existingPayment?.length) continue;

        const { error } = await supabase.from('payments').insert({
          id: randomUUID(),
          permission_slip_id: slip.id,
          amount_cents: pricePerStudent,
          status: 'succeeded',
          payment_method: 'card',
          stripe_payment_intent_id: `pi_ja_${randomUUID().substring(0, 16)}`,
          paid_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        });
        if (!error) paymentCount++;
      }
    }
    console.log(`   ✓ Created ${paymentCount} payments`);
  }

  console.log('\n=== JA FINANCE PARK DEMO VERIFICATION ===');

  const { data: jaVenue } = await supabase.from('venues').select('name, rating, review_count').eq('id', JA_VENUE_ID).single();
  console.log(`Venue: ${jaVenue?.name} (${jaVenue?.rating}★, ${jaVenue?.review_count} reviews)`);

  const { count: expCount } = await supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('venue_id', JA_VENUE_ID);
  console.log(`Experiences: ${expCount}`);

  const { count: tierCount } = await supabase.from('pricing_tiers').select('*', { count: 'exact', head: true })
    .in('experience_id', EXPERIENCES.map(e => e.id));
  console.log(`Pricing Tiers: ${tierCount}`);

  const { count: teamCount } = await supabase.from('venue_users').select('*', { count: 'exact', head: true }).eq('venue_id', JA_VENUE_ID);
  console.log(`Team Members: ${teamCount}`);

  const { count: bookingTotal } = await supabase.from('venue_bookings').select('*', { count: 'exact', head: true }).eq('venue_id', JA_VENUE_ID);
  console.log(`Bookings: ${bookingTotal}`);

  const { data: bookingRevenue } = await supabase.from('venue_bookings')
    .select('quoted_price_cents, paid_cents, status').eq('venue_id', JA_VENUE_ID);
  const totalQuoted = bookingRevenue?.reduce((s, b) => s + b.quoted_price_cents, 0) || 0;
  const totalPaid = bookingRevenue?.reduce((s, b) => s + b.paid_cents, 0) || 0;
  console.log(`Revenue: $${(totalQuoted / 100).toFixed(2)} quoted, $${(totalPaid / 100).toFixed(2)} paid`);

  console.log(`\n✅ JA Finance Park demo is ready!`);
  console.log(`\nLogin at /venue with:`);
  console.log(`  Email: ${JA_ADMIN.email}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`\nTeam members can also login:`);
  for (const member of JA_TEAM) {
    console.log(`  ${member.email} (${member.role})`);
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
