import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SCHOOL_ID = '00000000-0000-0000-0001-019cb7f84da8';
const PASSWORD = 'TripSlip2026!';

const studentNames = [
  { first: 'Sofia', last: 'Garcia' },
  { first: 'Liam', last: 'Johnson' },
  { first: 'Emma', last: 'Williams' },
  { first: 'Noah', last: 'Brown' },
  { first: 'Olivia', last: 'Jones' },
  { first: 'Ethan', last: 'Davis' },
  { first: 'Ava', last: 'Miller' },
  { first: 'Mason', last: 'Wilson' },
  { first: 'Isabella', last: 'Moore' },
  { first: 'Lucas', last: 'Taylor' },
  { first: 'Mia', last: 'Anderson' },
  { first: 'Aiden', last: 'Thomas' },
  { first: 'Amelia', last: 'Jackson' },
  { first: 'James', last: 'White' },
  { first: 'Harper', last: 'Harris' },
  { first: 'Benjamin', last: 'Martin' },
  { first: 'Evelyn', last: 'Thompson' },
  { first: 'Daniel', last: 'Martinez' },
  { first: 'Abigail', last: 'Robinson' },
  { first: 'Henry', last: 'Clark' },
  { first: 'Emily', last: 'Lewis' },
  { first: 'Alexander', last: 'Lee' },
];

async function createOrGetUser(email, password, metadata = {}) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users?.find(u => u.email === email);
  if (existingUser) {
    console.log(`  User ${email} already exists: ${existingUser.id}`);
    return existingUser;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) {
    console.log(`  Error creating ${email}:`, error.message);
    return null;
  }
  console.log(`  Created user ${email}: ${data.user.id}`);
  return data.user;
}

async function run() {
  console.log('=== Seeding Pilot Users ===\n');

  console.log('1. Creating Teacher — Sarah Chen');
  const teacherUser = await createOrGetUser('sarah.chen@lincolnelementary.edu', PASSWORD, {
    first_name: 'Sarah', last_name: 'Chen', role: 'teacher'
  });
  if (!teacherUser) return;

  const { data: existingTeacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', teacherUser.id)
    .maybeSingle();

  let teacherId;
  if (existingTeacher) {
    teacherId = existingTeacher.id;
    console.log('  Teacher record exists:', teacherId);
  } else {
    const { data: teacher, error: tErr } = await supabase
      .from('teachers')
      .insert({
        first_name: 'Sarah',
        last_name: 'Chen',
        email: 'sarah.chen@lincolnelementary.edu',
        user_id: teacherUser.id,
        school_id: SCHOOL_ID,
      })
      .select()
      .single();
    if (tErr) { console.log('  Teacher insert error:', tErr.message); return; }
    teacherId = teacher.id;
    console.log('  Created teacher:', teacherId);
  }

  console.log('\n2. Creating Roster — Mrs. Chen\'s 5th Grade');
  const { data: existingRoster } = await supabase
    .from('rosters')
    .select('id')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  let rosterId;
  if (existingRoster) {
    rosterId = existingRoster.id;
    console.log('  Roster exists:', rosterId);
  } else {
    const { data: roster, error: rErr } = await supabase
      .from('rosters')
      .insert({
        teacher_id: teacherId,
        name: "Mrs. Chen's 5th Grade",
      })
      .select()
      .single();
    if (rErr) { console.log('  Roster insert error:', rErr.message); return; }
    rosterId = roster.id;
    console.log('  Created roster:', rosterId);
  }

  console.log('\n3. Creating Students');
  const { data: existingStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('roster_id', rosterId);

  let studentIds = [];
  if (existingStudents?.length >= 20) {
    studentIds = existingStudents.map(s => s.id);
    console.log(`  ${studentIds.length} students already exist`);
  } else {
    if (existingStudents?.length) {
      await supabase.from('students').delete().eq('roster_id', rosterId);
    }
    const studentsToInsert = studentNames.map((s, i) => ({
      roster_id: rosterId,
      first_name: s.first,
      last_name: s.last,
      grade: i < 11 ? '5' : '4',
      medical_info: i === 3 ? 'Peanut allergy - carries EpiPen' : i === 8 ? 'Asthma - uses inhaler' : null,
    }));
    const { data: students, error: sErr } = await supabase
      .from('students')
      .insert(studentsToInsert)
      .select();
    if (sErr) { console.log('  Student insert error:', sErr.message); return; }
    studentIds = students.map(s => s.id);
    console.log(`  Created ${studentIds.length} students`);
  }

  const sofiaId = studentIds[0];

  console.log('\n4. Creating School Admin — Dr. Patricia Reeves');
  const schoolAdminUser = await createOrGetUser('patricia.reeves@lincolnelementary.edu', PASSWORD, {
    first_name: 'Patricia', last_name: 'Reeves', role: 'school_admin'
  });

  console.log('\n5. Creating Parent — Maria Garcia');
  const parentUser = await createOrGetUser('maria.garcia@gmail.com', PASSWORD, {
    first_name: 'Maria', last_name: 'Garcia', role: 'parent'
  });

  if (parentUser) {
    const { data: existingParent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', parentUser.id)
      .maybeSingle();

    let parentId;
    if (existingParent) {
      parentId = existingParent.id;
    } else {
      const { data: parent, error: pErr } = await supabase
        .from('parents')
        .insert({
          user_id: parentUser.id,
          first_name: 'Maria',
          last_name: 'Garcia',
          email: 'maria.garcia@gmail.com',
          phone: '+13125551234',
        })
        .select()
        .single();
      if (pErr) { console.log('  Parent insert error:', pErr.message); return; }
      parentId = parent.id;
      console.log('  Created parent:', parentId);
    }

    const { data: existingLink } = await supabase
      .from('student_parents')
      .select('id')
      .eq('student_id', sofiaId)
      .eq('parent_id', parentId)
      .maybeSingle();

    if (!existingLink) {
      await supabase.from('student_parents').insert({
        student_id: sofiaId,
        parent_id: parentId,
        relationship: 'mother',
      });
      console.log('  Linked parent to Sofia Garcia');
    }
  }

  console.log('\n6. Creating Venue Admin — James Park');
  const venueAdminUser = await createOrGetUser('james.park@sciencediscovery.org', PASSWORD, {
    first_name: 'James', last_name: 'Park', role: 'venue_admin'
  });

  console.log('\n7. Waiting for real venues to be seeded...');
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name')
    .limit(5);

  let venueId = venues?.[0]?.id;
  let experienceId;

  if (!venueId) {
    console.log('  No venues yet — creating a sample venue');
    const { data: venue } = await supabase
      .from('venues')
      .insert({
        name: 'Museum of Science and Industry',
        description: 'One of the largest science museums in the Western Hemisphere, featuring interactive exhibits.',
        address: { street: '5700 S DuSable Lake Shore Dr', city: 'Chicago', state: 'IL', zipCode: '60637' },
        contact_email: 'info@msichicago.org',
        contact_phone: '(773) 684-1414',
        website: 'https://www.msichicago.org',
        verified: true,
        source: 'platform',
        rating: 4.6,
        review_count: 42,
        primary_photo_url: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800',
      })
      .select()
      .single();
    venueId = venue?.id;
    console.log('  Created venue:', venueId);
  }

  if (venueId) {
    const { data: existingExp } = await supabase
      .from('experiences')
      .select('id')
      .eq('venue_id', venueId)
      .limit(1)
      .maybeSingle();

    if (existingExp) {
      experienceId = existingExp.id;
    } else {
      const { data: exp } = await supabase
        .from('experiences')
        .insert({
          venue_id: venueId,
          title: 'Guided Science Exploration',
          description: 'A 2-hour guided tour through our most popular interactive exhibits.',
          duration_minutes: 120,
          capacity: 60,
          grade_levels: ['3', '4', '5', '6'],
          subjects: ['Science', 'Technology'],
          active: true,
        })
        .select()
        .single();
      experienceId = exp?.id;

      if (experienceId) {
        await supabase.from('pricing_tiers').insert([
          { experience_id: experienceId, name: 'Standard Group', price_cents: 1200, min_students: 1, max_students: 30, free_chaperones: 3 },
          { experience_id: experienceId, name: 'Large Group', price_cents: 1000, min_students: 31, max_students: 100, free_chaperones: 5 },
        ]);
        console.log('  Created experience + pricing');
      }
    }

    if (venueAdminUser) {
      const { data: existingVU } = await supabase
        .from('venue_users')
        .select('id')
        .eq('user_id', venueAdminUser.id)
        .maybeSingle();

      if (!existingVU) {
        await supabase.from('venue_users').insert({
          venue_id: venueId,
          user_id: venueAdminUser.id,
          role: 'admin',
        });
        console.log('  Linked venue admin to venue');
      }
    }
  }

  console.log('\n8. Creating Demo Trips');
  if (experienceId && teacherId) {
    const { data: existingTrips } = await supabase
      .from('trips')
      .select('id')
      .eq('teacher_id', teacherId);

    if (existingTrips?.length >= 2) {
      console.log(`  ${existingTrips.length} trips already exist`);
    } else {
      const completedTrip = await supabase
        .from('trips')
        .insert({
          teacher_id: teacherId,
          experience_id: experienceId,
          trip_date: '2026-02-15',
          trip_time: '09:00',
          student_count: 22,
          status: 'completed',
          direct_link_token: crypto.randomUUID(),
          is_free: false,
          funding_model: 'parent_pay',
          transportation: { type: 'district_bus', departureTime: '08:30', returnTime: '14:00', pickupLocation: 'Main entrance' },
        })
        .select()
        .single();
      console.log('  Created completed trip:', completedTrip.data?.id);

      const { data: upcomingTrip } = await supabase
        .from('trips')
        .insert({
          teacher_id: teacherId,
          experience_id: experienceId,
          trip_date: '2026-04-15',
          trip_time: '09:30',
          student_count: 22,
          status: 'approved',
          direct_link_token: crypto.randomUUID(),
          is_free: false,
          funding_model: 'parent_pay',
          assistance_fund_cents: 0,
          transportation: { type: 'charter_bus', departureTime: '08:00', returnTime: '15:00', pickupLocation: 'Front of school', companyName: 'ABC Bus Co', companyPhone: '312-555-0199' },
          configured_addons: [
            { name: 'Gift Shop', description: 'Money for the museum gift shop', priceCents: 1500, required: false, category: 'Gift Shop' },
            { name: 'Lunch', description: 'Pizza lunch at the museum cafeteria', priceCents: 800, required: false, category: 'Food/Snacks' },
          ],
        })
        .select()
        .single();
      console.log('  Created upcoming trip:', upcomingTrip?.id);

      if (upcomingTrip) {
        const slipStudentIds = studentIds.slice(0, 22);
        const slips = slipStudentIds.map((sid, i) => ({
          trip_id: upcomingTrip.id,
          student_id: sid,
          status: i === 0 ? 'pending' : i < 5 ? 'signed' : i < 10 ? 'paid' : 'pending',
          magic_link_token: crypto.randomUUID(),
          parent_name: i === 0 ? 'Maria Garcia' : null,
          parent_email: i === 0 ? 'maria.garcia@gmail.com' : null,
          parent_phone: i === 0 ? '+13125551234' : null,
          financial_assistance_requested: i === 7,
        }));
        const { data: createdSlips, error: slipErr } = await supabase
          .from('permission_slips')
          .insert(slips)
          .select();
        if (slipErr) {
          console.log('  Slip insert error:', slipErr.message);
        } else {
          console.log(`  Created ${createdSlips.length} permission slips`);
          const sofiaSlip = createdSlips.find(s => s.student_id === sofiaId);
          if (sofiaSlip) {
            console.log(`  Sofia's magic link token: ${sofiaSlip.magic_link_token}`);
            console.log(`  Parent URL: /parent/permission-slip?token=${sofiaSlip.magic_link_token}`);
          }
        }
      }

      const { data: draftTrip } = await supabase
        .from('trips')
        .insert({
          teacher_id: teacherId,
          experience_id: experienceId,
          trip_date: '2026-05-20',
          trip_time: '10:00',
          student_count: 22,
          status: 'pending_approval',
          direct_link_token: crypto.randomUUID(),
          is_free: true,
          funding_model: 'school_funded',
          transportation: { type: 'walking', departureTime: '09:45', returnTime: '12:00' },
        })
        .select()
        .single();
      console.log('  Created pending approval trip:', draftTrip?.id);
    }
  }

  console.log('\n=== Pilot Users Ready ===');
  console.log('Teacher: sarah.chen@lincolnelementary.edu / TripSlip2026!');
  console.log('Parent: maria.garcia@gmail.com / TripSlip2026!');
  console.log('Venue: james.park@sciencediscovery.org / TripSlip2026!');
  console.log('School Admin: patricia.reeves@lincolnelementary.edu / TripSlip2026!');
}

run().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
