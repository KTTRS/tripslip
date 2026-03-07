import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PASSWORD = 'TripSlip2026!';

const ROLE_IDS = {
  teacher: '5f9b127f-9032-4874-96f7-cf3cd032bd8d',
  school_admin: 'c6f77991-08dc-4d44-bdfb-c3e510e12b58',
  district_admin: 'd5adfbfc-a606-4892-9fcf-93fbed76af98',
  tripslip_admin: '81d55787-c7ec-42a1-9a47-b1aad6605d32',
  venue_admin: '97b30b11-18eb-430d-8d2b-609f7ee0a3f7',
  parent: '8251ab6d-f4c0-4b9e-b20b-a88ce44a0250',
};

const SCHOOL_IDS = {
  lincoln: '00000000-0000-0000-0001-019cb7f84da8',
  riverside: '00000000-0000-0000-0002-019cb7f84da8',
  sunset: '00000000-0000-0000-0003-019cb7f84da8',
};

const ROSTER_IDS = {
  sarah_5th: 'a0000000-0000-0000-0001-000000000001',
  sarah_4th: 'a0000000-0000-0000-0001-000000000002',
  mike_3rd: 'a0000000-0000-0000-0002-000000000001',
  rachel_6th: 'a0000000-0000-0000-0003-000000000001',
  rachel_7th: 'a0000000-0000-0000-0003-000000000002',
  david_4th: 'a0000000-0000-0000-0004-000000000001',
};

const SCHOOLS = [
  {
    id: SCHOOL_IDS.lincoln,
    name: 'Lincoln Elementary School',
    address: { street: '1847 N Talman Ave', city: 'Chicago', state: 'IL', zipCode: '60647' },
  },
  {
    id: SCHOOL_IDS.riverside,
    name: 'Riverside Middle School',
    address: { street: '250 W 75th St', city: 'New York', state: 'NY', zipCode: '10023' },
  },
  {
    id: SCHOOL_IDS.sunset,
    name: 'Sunset Elementary School',
    address: { street: '4100 Sunset Blvd', city: 'Los Angeles', state: 'CA', zipCode: '90029' },
  },
];

const DEMO_USERS = [
  { email: 'sarah.chen@lincolnelementary.edu', role: 'teacher', firstName: 'Sarah', lastName: 'Chen', school: 'lincoln' },
  { email: 'mike.johnson@lincolnelementary.edu', role: 'teacher', firstName: 'Mike', lastName: 'Johnson', school: 'lincoln' },
  { email: 'rachel.kim@riverside.edu', role: 'teacher', firstName: 'Rachel', lastName: 'Kim', school: 'riverside' },
  { email: 'david.martinez@sunset.edu', role: 'teacher', firstName: 'David', lastName: 'Martinez', school: 'sunset' },
  { email: 'patricia.reeves@lincolnelementary.edu', role: 'school_admin', firstName: 'Patricia', lastName: 'Reeves', school: 'lincoln' },
  { email: 'robert.taylor@riverside.edu', role: 'school_admin', firstName: 'Robert', lastName: 'Taylor', school: 'riverside' },
  { email: 'james.park@sciencediscovery.org', role: 'venue_admin', firstName: 'James', lastName: 'Park', venue: 'msi' },
  { email: 'lisa.wong@artinstitute.org', role: 'venue_admin', firstName: 'Lisa', lastName: 'Wong', venue: 'artinstitute' },
  { email: 'maria.garcia@gmail.com', role: 'parent', firstName: 'Maria', lastName: 'Garcia' },
  { email: 'tom.wilson@gmail.com', role: 'parent', firstName: 'Tom', lastName: 'Wilson' },
  { email: 'amy.chen@outlook.com', role: 'parent', firstName: 'Amy', lastName: 'Chen' },
  { email: 'jennifer.patel@gmail.com', role: 'parent', firstName: 'Jennifer', lastName: 'Patel' },
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
  console.log('=== TripSlip Demo Scenario Seeding ===\n');

  console.log('1. Creating schools...');
  for (const school of SCHOOLS) {
    const { error } = await supabase.from('schools').upsert(school, { onConflict: 'id' });
    if (error) console.error(`   ERROR ${school.name}:`, error.message);
    else console.log(`   ✓ ${school.name}`);
  }

  console.log('\n2. Creating auth users...');
  const userIds = {};
  for (const user of DEMO_USERS) {
    const uid = await ensureAuthUser(user.email, user.firstName, user.lastName);
    if (uid) userIds[user.email] = uid;
  }

  console.log('\n3. Creating role assignments...');
  const roleAssignments = [];
  for (const user of DEMO_USERS) {
    const uid = userIds[user.email];
    if (!uid) continue;

    let orgType = null;
    let orgId = null;

    if (user.role === 'teacher' || user.role === 'school_admin') {
      orgType = 'school';
      orgId = SCHOOL_IDS[user.school];
    } else if (user.role === 'venue_admin') {
      orgType = 'venue';
      orgId = SCHOOL_IDS.lincoln;
    } else if (user.role === 'parent') {
      orgType = 'school';
      orgId = SCHOOL_IDS.lincoln;
    }

    roleAssignments.push({
      id: randomUUID(),
      user_id: uid,
      role_id: ROLE_IDS[user.role],
      organization_type: orgType,
      organization_id: orgId,
      is_active: true,
    });
  }

  for (const ra of roleAssignments) {
    const { data: existing } = await supabase
      .from('user_role_assignments')
      .select('id')
      .eq('user_id', ra.user_id)
      .eq('role_id', ra.role_id)
      .limit(1);

    if (existing?.length > 0) {
      console.log(`   Role assignment exists for user ${ra.user_id.substring(0, 8)}`);
      continue;
    }

    const { error } = await supabase.from('user_role_assignments').insert(ra);
    if (error) console.error(`   ERROR role assignment:`, error.message);
    else console.log(`   ✓ Role assigned for ${ra.user_id.substring(0, 8)}`);
  }

  console.log('\n4. Creating teacher records...');
  const teacherRecords = {};
  for (const user of DEMO_USERS.filter(u => u.role === 'teacher')) {
    const uid = userIds[user.email];
    if (!uid) continue;

    const teacherId = randomUUID();
    const { data: existing } = await supabase.from('teachers').select('id').eq('user_id', uid).limit(1);

    if (existing?.length > 0) {
      teacherRecords[user.email] = existing[0].id;
      console.log(`   Teacher exists: ${user.firstName} ${user.lastName} (${existing[0].id.substring(0, 8)})`);
      continue;
    }

    const { data, error } = await supabase.from('teachers').insert({
      id: teacherId,
      user_id: uid,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      school_id: SCHOOL_IDS[user.school],
      is_active: true,
    }).select('id').single();

    if (error) console.error(`   ERROR teacher ${user.email}:`, error.message);
    else {
      teacherRecords[user.email] = data.id;
      console.log(`   ✓ ${user.firstName} ${user.lastName} at ${SCHOOLS.find(s => s.id === SCHOOL_IDS[user.school])?.name}`);
    }
  }

  console.log('\n5. Creating rosters & students...');

  const rosterDefs = [
    { id: ROSTER_IDS.sarah_5th, teacher: 'sarah.chen@lincolnelementary.edu', name: "Mrs. Chen's 5th Grade", grade: '5', students: [
      ['Sofia', 'Garcia'], ['Ethan', 'Nguyen'], ['Maya', 'Robinson'], ['Lucas', 'Thompson'], ['Ava', 'Williams'],
      ['Noah', 'Brown'], ['Chloe', 'Martinez'], ['Jayden', 'Lee'], ['Lily', 'Anderson'], ['Caleb', 'Harris'],
      ['Zoe', 'Mitchell'], ['Owen', 'Walker'], ['Ella', 'Scott'], ['Mason', 'Turner'], ['Harper', 'Moore'],
      ['Logan', 'Allen'], ['Scarlett', 'Young'], ['Aiden', 'King'], ['Grace', 'Wright'], ['Jack', 'Adams'],
      ['Mila', 'Baker'], ['Levi', 'Green'],
    ]},
    { id: ROSTER_IDS.sarah_4th, teacher: 'sarah.chen@lincolnelementary.edu', name: "Mrs. Chen's 4th Grade", grade: '4', students: [
      ['Emma', 'Johnson'], ['Liam', 'Chen'], ['Olivia', 'Patel'], ['Benjamin', 'Davis'], ['Amelia', 'Wilson'],
      ['Henry', 'Lopez'], ['Aria', 'Thomas'], ['Sebastian', 'Jackson'], ['Nora', 'Perez'], ['Leo', 'Rivera'],
      ['Hazel', 'Campbell'], ['Theodore', 'Parker'], ['Stella', 'Evans'], ['Finn', 'Edwards'], ['Luna', 'Collins'],
      ['Carter', 'Stewart'], ['Violet', 'Sanchez'], ['Wyatt', 'Morris'],
    ]},
    { id: ROSTER_IDS.mike_3rd, teacher: 'mike.johnson@lincolnelementary.edu', name: "Mr. Johnson's 3rd Grade", grade: '3', students: [
      ['Zoey', 'Miller'], ['Dylan', 'Davis'], ['Layla', 'Rodriguez'], ['Hunter', 'Martinez'], ['Penelope', 'Clark'],
      ['Cole', 'Lewis'], ['Riley', 'Robinson'], ['Chase', 'Hall'], ['Aubrey', 'Young'], ['Isaiah', 'Walker'],
      ['Savannah', 'King'], ['Jaxon', 'Scott'], ['Brooklyn', 'Hill'], ['Cooper', 'Green'], ['Paisley', 'Baker'],
      ['Xavier', 'Nelson'], ['Kennedy', 'Carter'], ['Easton', 'Mitchell'], ['Madelyn', 'Phillips'], ['Adrian', 'Turner'],
    ]},
    { id: ROSTER_IDS.rachel_6th, teacher: 'rachel.kim@riverside.edu', name: "Ms. Kim's 6th Grade", grade: '6', students: [
      ['Aaliyah', 'Washington'], ['Brandon', 'Jefferson'], ['Carmen', 'Reyes'], ['Derek', 'Chang'], ['Elena', 'Santos'],
      ['Frank', 'O\'Brien'], ['Gabriella', 'Morales'], ['Hassan', 'Ahmed'], ['Ingrid', 'Svensson'], ['Joshua', 'Park'],
      ['Kira', 'Nakamura'], ['Lorenzo', 'Rossi'], ['Mei', 'Li'], ['Nathan', 'Brooks'], ['Priya', 'Sharma'],
      ['Quinn', 'Murphy'], ['Rosa', 'Hernandez'], ['Samuel', 'Fischer'], ['Tanya', 'Volkov'], ['Uma', 'Patel'],
      ['Victor', 'Cruz'], ['Wendy', 'Kim'], ['Yusuf', 'Ali'], ['Zara', 'Mohamed'],
    ]},
    { id: ROSTER_IDS.rachel_7th, teacher: 'rachel.kim@riverside.edu', name: "Ms. Kim's 7th Grade", grade: '7', students: [
      ['Alex', 'Rivera'], ['Bianca', 'Torres'], ['Carlos', 'Mendoza'], ['Diana', 'Flores'], ['Eduardo', 'Castillo'],
      ['Fatima', 'Hassan'], ['George', 'Peterson'], ['Helen', 'O\'Connor'], ['Ivan', 'Kozlov'], ['Julia', 'Romano'],
      ['Kevin', 'Nguyen'], ['Lucia', 'Moreno'], ['Marcus', 'Williams'], ['Natasha', 'Petrov'], ['Oscar', 'Jimenez'],
      ['Patricia', 'Lee'], ['Ricardo', 'Gonzalez'], ['Sophia', 'Chen'], ['Tyrone', 'Jackson'], ['Valentina', 'Ruiz'],
    ]},
    { id: ROSTER_IDS.david_4th, teacher: 'david.martinez@sunset.edu', name: "Mr. Martinez's 4th Grade", grade: '4', students: [
      ['Aaliyah', 'Jones'], ['Brian', 'Smith'], ['Clara', 'Rodriguez'], ['Daniel', 'Kim'], ['Elena', 'White'],
      ['Freddy', 'Lopez'], ['Grace', 'Taylor'], ['Hugo', 'Anderson'], ['Isabella', 'Thomas'], ['Jacob', 'Garcia'],
      ['Kaylee', 'Martin'], ['Leo', 'Hernandez'], ['Mia', 'Robinson'], ['Nathan', 'Clark'], ['Olivia', 'Lewis'],
      ['Pablo', 'Martinez'], ['Quinn', 'Hall'], ['Ruby', 'Allen'], ['Sam', 'Young'], ['Tara', 'King'],
      ['Ulises', 'Ramirez'], ['Victoria', 'Lee'],
    ]},
  ];

  for (const rosterDef of rosterDefs) {
    const teacherId = teacherRecords[rosterDef.teacher];
    if (!teacherId) {
      console.log(`   Skipping roster ${rosterDef.name} - no teacher found`);
      continue;
    }

    const { error: rosterErr } = await supabase.from('rosters').upsert({
      id: rosterDef.id,
      teacher_id: teacherId,
      name: rosterDef.name,
      grade_level: rosterDef.grade,
    }, { onConflict: 'id' });

    if (rosterErr) {
      console.error(`   ERROR roster ${rosterDef.name}:`, rosterErr.message);
      continue;
    }

    await supabase.from('students').delete().eq('roster_id', rosterDef.id);

    const students = rosterDef.students.map(([first, last]) => ({
      id: randomUUID(),
      roster_id: rosterDef.id,
      first_name: first,
      last_name: last,
      grade: rosterDef.grade,
    }));

    const { error: stuErr } = await supabase.from('students').insert(students);
    if (stuErr) console.error(`   ERROR students for ${rosterDef.name}:`, stuErr.message);
    else console.log(`   ✓ ${rosterDef.name}: ${students.length} students`);
  }

  console.log('\n6. Picking experiences for trips...');
  const { data: allExperiences } = await supabase
    .from('experiences')
    .select('id, title, venue_id, venue:venues(name, id)')
    .limit(100);

  if (!allExperiences?.length) {
    console.error('   ERROR: No experiences found. Run seed-demo-data.mjs first.');
    return;
  }
  console.log(`   Found ${allExperiences.length} experiences`);

  const chicagoExps = allExperiences.filter(e => {
    return e.venue?.name?.includes('Museum of Science') || 
           e.venue?.name?.includes('Field Museum') ||
           e.venue?.name?.includes('Shedd') ||
           e.venue?.name?.includes('Art Institute') ||
           e.venue?.name?.includes('Lincoln Park Zoo') ||
           e.venue?.name?.includes('Adler');
  });

  const nycExps = allExperiences.filter(e => {
    return e.venue?.name?.includes('American Museum') ||
           e.venue?.name?.includes('Metropolitan') ||
           e.venue?.name?.includes('Intrepid') ||
           e.venue?.name?.includes('Bronx Zoo') ||
           e.venue?.name?.includes('Brooklyn');
  });

  const laExps = allExperiences.filter(e => {
    return e.venue?.name?.includes('Natural History Museum of Los Angeles') ||
           e.venue?.name?.includes('California Science') ||
           e.venue?.name?.includes('Griffith') ||
           e.venue?.name?.includes('Los Angeles Zoo') ||
           e.venue?.name?.includes('LACMA');
  });

  console.log(`   Chicago: ${chicagoExps.length}, NYC: ${nycExps.length}, LA: ${laExps.length}`);

  console.log('\n7. Creating trips in various states...');

  const sarahTeacherId = teacherRecords['sarah.chen@lincolnelementary.edu'];
  const mikeTeacherId = teacherRecords['mike.johnson@lincolnelementary.edu'];
  const rachelTeacherId = teacherRecords['rachel.kim@riverside.edu'];
  const davidTeacherId = teacherRecords['david.martinez@sunset.edu'];

  const tripDefs = [];

  if (sarahTeacherId && chicagoExps.length >= 4) {
    tripDefs.push(
      {
        id: 'b0000000-0000-0000-0001-000000000001',
        experience_id: chicagoExps[0]?.id,
        teacher_id: sarahTeacherId,
        trip_date: '2026-01-20',
        trip_time: '09:00:00',
        student_count: 22,
        status: 'completed',
        direct_link_token: randomUUID(),
        transportation: { type: 'district_bus', departureTime: '08:15', returnTime: '14:30', pickupLocation: 'Main entrance' },
        is_free: false,
        funding_model: 'parent_pay',
        assistance_fund_cents: 5000,
        label: 'Sarah - completed trip (Jan)',
      },
      {
        id: 'b0000000-0000-0000-0001-000000000002',
        experience_id: chicagoExps[1]?.id,
        teacher_id: sarahTeacherId,
        trip_date: '2026-04-15',
        trip_time: '09:30:00',
        student_count: 22,
        status: 'approved',
        direct_link_token: randomUUID(),
        transportation: { type: 'district_bus', departureTime: '08:30', returnTime: '14:00', pickupLocation: 'Main entrance' },
        is_free: false,
        funding_model: 'parent_pay',
        assistance_fund_cents: 3000,
        label: 'Sarah - approved trip (Apr)',
      },
      {
        id: 'b0000000-0000-0000-0001-000000000003',
        experience_id: chicagoExps[2]?.id,
        teacher_id: sarahTeacherId,
        trip_date: '2026-05-20',
        trip_time: '10:00:00',
        student_count: 18,
        status: 'pending_approval',
        direct_link_token: randomUUID(),
        transportation: { type: 'charter_bus', departureTime: '09:00', returnTime: '15:00', pickupLocation: 'Front circle' },
        is_free: false,
        funding_model: 'school_funded',
        assistance_fund_cents: 0,
        label: 'Sarah - pending approval (May)',
      },
      {
        id: 'b0000000-0000-0000-0001-000000000004',
        experience_id: chicagoExps[3]?.id,
        teacher_id: sarahTeacherId,
        trip_date: '2026-06-05',
        trip_time: '09:00:00',
        student_count: 22,
        status: 'confirmed',
        direct_link_token: randomUUID(),
        transportation: { type: 'parent_carpool', departureTime: '08:45', returnTime: '13:00', pickupLocation: 'Parking lot' },
        is_free: false,
        funding_model: 'parent_pay',
        assistance_fund_cents: 2500,
        label: 'Sarah - confirmed trip with active slips (Jun)',
      }
    );
  }

  if (mikeTeacherId && chicagoExps.length >= 1) {
    tripDefs.push({
      id: 'b0000000-0000-0000-0002-000000000001',
      experience_id: chicagoExps[0]?.id,
      teacher_id: mikeTeacherId,
      trip_date: '2026-05-10',
      trip_time: '09:00:00',
      student_count: 20,
      status: 'draft',
      direct_link_token: randomUUID(),
      transportation: null,
      is_free: false,
      funding_model: 'parent_pay',
      assistance_fund_cents: 0,
      label: 'Mike - draft trip (new teacher)',
    });
  }

  if (rachelTeacherId && nycExps.length >= 3) {
    tripDefs.push(
      {
        id: 'b0000000-0000-0000-0003-000000000001',
        experience_id: nycExps[0]?.id,
        teacher_id: rachelTeacherId,
        trip_date: '2026-03-10',
        trip_time: '09:00:00',
        student_count: 24,
        status: 'confirmed',
        direct_link_token: randomUUID(),
        transportation: { type: 'subway', departureTime: '08:00', returnTime: '14:30', pickupLocation: 'School entrance' },
        is_free: false,
        funding_model: 'parent_pay',
        assistance_fund_cents: 4000,
        label: 'Rachel - confirmed NYC trip (Mar)',
      },
      {
        id: 'b0000000-0000-0000-0003-000000000002',
        experience_id: nycExps[1]?.id,
        teacher_id: rachelTeacherId,
        trip_date: '2026-04-25',
        trip_time: '10:00:00',
        student_count: 20,
        status: 'approved',
        direct_link_token: randomUUID(),
        transportation: { type: 'district_bus', departureTime: '09:00', returnTime: '15:00', pickupLocation: 'Bus lane' },
        is_free: false,
        funding_model: 'split_funded',
        assistance_fund_cents: 6000,
        label: 'Rachel - approved NYC trip (Apr)',
      },
      {
        id: 'b0000000-0000-0000-0003-000000000003',
        experience_id: nycExps[2]?.id,
        teacher_id: rachelTeacherId,
        trip_date: '2026-02-05',
        trip_time: '09:30:00',
        student_count: 24,
        status: 'completed',
        direct_link_token: randomUUID(),
        transportation: { type: 'subway', departureTime: '08:30', returnTime: '13:00', pickupLocation: 'School entrance' },
        is_free: true,
        funding_model: 'school_funded',
        assistance_fund_cents: 0,
        label: 'Rachel - completed free trip (Feb)',
      }
    );
  }

  if (davidTeacherId && laExps.length >= 2) {
    tripDefs.push(
      {
        id: 'b0000000-0000-0000-0004-000000000001',
        experience_id: laExps[0]?.id,
        teacher_id: davidTeacherId,
        trip_date: '2026-05-15',
        trip_time: '09:00:00',
        student_count: 22,
        status: 'draft',
        direct_link_token: randomUUID(),
        transportation: null,
        is_free: false,
        funding_model: 'parent_pay',
        assistance_fund_cents: 0,
        label: 'David - draft LA trip 1',
      },
      {
        id: 'b0000000-0000-0000-0004-000000000002',
        experience_id: laExps[1]?.id,
        teacher_id: davidTeacherId,
        trip_date: '2026-06-01',
        trip_time: '10:00:00',
        student_count: 22,
        status: 'draft',
        direct_link_token: randomUUID(),
        transportation: null,
        is_free: false,
        funding_model: 'parent_pay',
        assistance_fund_cents: 0,
        label: 'David - draft LA trip 2',
      }
    );
  }

  for (const trip of tripDefs) {
    if (!trip.experience_id) {
      console.log(`   Skipping: ${trip.label} - no experience found`);
      continue;
    }
    const { label, ...tripData } = trip;
    const { error } = await supabase.from('trips').upsert(tripData, { onConflict: 'id' });
    if (error) console.error(`   ERROR ${label}:`, error.message);
    else console.log(`   ✓ ${label}`);
  }

  console.log('\n8. Creating permission slips...');

  const completedTrip = tripDefs.find(t => t.teacher_id === sarahTeacherId && t.status === 'completed');
  const confirmedTrip = tripDefs.find(t => t.teacher_id === sarahTeacherId && t.status === 'confirmed');
  const rachelConfirmed = tripDefs.find(t => t.teacher_id === rachelTeacherId && t.status === 'confirmed');
  const rachelCompleted = tripDefs.find(t => t.teacher_id === rachelTeacherId && t.status === 'completed');

  const mariaUserId = userIds['maria.garcia@gmail.com'];
  const tomUserId = userIds['tom.wilson@gmail.com'];
  const amyUserId = userIds['amy.chen@outlook.com'];
  const jenniferUserId = userIds['jennifer.patel@gmail.com'];

  const { data: sarahStudents } = await supabase.from('students').select('id, first_name, last_name').eq('roster_id', ROSTER_IDS.sarah_5th).limit(22);
  const { data: rachelStudents } = await supabase.from('students').select('id, first_name, last_name').eq('roster_id', ROSTER_IDS.rachel_6th).limit(24);

  await supabase.from('permission_slips').delete().in('trip_id', tripDefs.map(t => t.id));

  const slips = [];

  if (completedTrip && sarahStudents?.length) {
    for (let i = 0; i < Math.min(sarahStudents.length, 20); i++) {
      const student = sarahStudents[i];
      slips.push({
        id: randomUUID(),
        trip_id: completedTrip.id,
        student_id: student.id,
        status: 'paid',
        signed_at: '2026-01-15T14:00:00Z',
        form_data: {
          childName: `${student.first_name} ${student.last_name}`,
          childGrade: '5',
          parentName: i < 5 ? 'Maria Garcia' : (i < 10 ? 'Amy Chen' : `Parent of ${student.first_name}`),
          parentEmail: i < 5 ? 'maria.garcia@gmail.com' : (i < 10 ? 'amy.chen@outlook.com' : `parent.${student.last_name.toLowerCase()}@email.com`),
          parentPhone: `312-555-${String(1000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency Contact for ${student.first_name}`,
          emergencyPhone: `312-555-${String(2000 + i).padStart(4, '0')}`,
          allergies: i === 3 ? 'Peanut allergy' : (i === 7 ? 'Bee sting allergy' : 'None'),
          medications: i === 3 ? 'EpiPen' : 'None',
        },
        signature_data: 'data:image/png;base64,signed',
      });
    }
  }

  if (confirmedTrip && sarahStudents?.length) {
    for (let i = 0; i < Math.min(sarahStudents.length, 22); i++) {
      const student = sarahStudents[i];
      let status;
      let signedAt = null;

      if (i < 8) {
        status = 'paid';
        signedAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      } else if (i < 12) {
        status = 'signed_pending_payment';
        signedAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      } else if (i < 16) {
        status = 'signed';
        signedAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      } else if (i < 20) {
        status = 'sent';
      } else {
        status = 'pending';
      }

      slips.push({
        id: randomUUID(),
        trip_id: confirmedTrip.id,
        student_id: student.id,
        status,
        signed_at: signedAt,
        form_data: status !== 'pending' && status !== 'sent' ? {
          childName: `${student.first_name} ${student.last_name}`,
          childGrade: '5',
          parentName: i < 3 ? 'Maria Garcia' : (i === 8 ? 'Tom Wilson' : `Parent of ${student.first_name}`),
          parentEmail: i < 3 ? 'maria.garcia@gmail.com' : (i === 8 ? 'tom.wilson@gmail.com' : `parent@email.com`),
          parentPhone: `312-555-${String(3000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${student.first_name}`,
          emergencyPhone: `312-555-${String(4000 + i).padStart(4, '0')}`,
          allergies: i === 2 ? 'Dairy allergy' : 'None',
          medications: 'None',
        } : null,
        signature_data: signedAt ? 'data:image/png;base64,signed' : null,
        financial_assistance_requested: i === 10 || i === 11,
        assistance_amount_covered: (i === 10 || i === 11) ? 1500 : null,
      });
    }
  }

  if (rachelConfirmed && rachelStudents?.length) {
    for (let i = 0; i < Math.min(rachelStudents.length, 24); i++) {
      const student = rachelStudents[i];
      let status;
      let signedAt = null;

      if (i < 15) {
        status = 'paid';
        signedAt = new Date(Date.now() - (i + 2) * 86400000).toISOString();
      } else if (i < 18) {
        status = 'signed_pending_payment';
        signedAt = new Date(Date.now() - 86400000).toISOString();
      } else if (i < 21) {
        status = 'sent';
      } else {
        status = 'pending';
      }

      slips.push({
        id: randomUUID(),
        trip_id: rachelConfirmed.id,
        student_id: student.id,
        status,
        signed_at: signedAt,
        form_data: signedAt ? {
          childName: `${student.first_name} ${student.last_name}`,
          childGrade: '6',
          parentName: i === 0 ? 'Jennifer Patel' : `Parent of ${student.first_name}`,
          parentEmail: i === 0 ? 'jennifer.patel@gmail.com' : `parent@email.com`,
          parentPhone: `212-555-${String(5000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${student.first_name}`,
          emergencyPhone: `212-555-${String(6000 + i).padStart(4, '0')}`,
          allergies: i === 5 ? 'Shellfish allergy' : 'None',
          medications: 'None',
        } : null,
        signature_data: signedAt ? 'data:image/png;base64,signed' : null,
      });
    }
  }

  if (rachelCompleted && rachelStudents?.length) {
    for (let i = 0; i < Math.min(rachelStudents.length, 24); i++) {
      const student = rachelStudents[i];
      slips.push({
        id: randomUUID(),
        trip_id: rachelCompleted.id,
        student_id: student.id,
        status: 'signed',
        signed_at: '2026-01-30T12:00:00Z',
        form_data: {
          childName: `${student.first_name} ${student.last_name}`,
          childGrade: '6',
          parentName: `Parent of ${student.first_name}`,
          parentEmail: `parent@email.com`,
          parentPhone: `212-555-${String(7000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${student.first_name}`,
          emergencyPhone: `212-555-${String(8000 + i).padStart(4, '0')}`,
          allergies: 'None',
          medications: 'None',
        },
        signature_data: 'data:image/png;base64,signed',
      });
    }
  }

  if (slips.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < slips.length; i += batchSize) {
      const batch = slips.slice(i, i + batchSize);
      const { error } = await supabase.from('permission_slips').insert(batch);
      if (error) console.error(`   ERROR inserting slips batch ${i / batchSize + 1}:`, error.message);
      else console.log(`   ✓ Inserted ${batch.length} permission slips (batch ${Math.floor(i / batchSize) + 1})`);
    }
  }

  console.log('\n9. Setting up venue admin links...');

  const msiVenue = allExperiences.find(e => e.venue?.name?.includes('Museum of Science and Industry'));
  const artVenue = allExperiences.find(e => e.venue?.name?.includes('Art Institute'));

  if (msiVenue && userIds['james.park@sciencediscovery.org']) {
    const { data: existingVU } = await supabase.from('venue_users')
      .select('id').eq('user_id', userIds['james.park@sciencediscovery.org']).limit(1);

    if (!existingVU?.length) {
      const { error } = await supabase.from('venue_users').insert({
        venue_id: msiVenue.venue.id,
        user_id: userIds['james.park@sciencediscovery.org'],
        role: 'administrator',
      });
      if (error) console.error('   ERROR MSI venue user:', error.message);
      else console.log('   ✓ James Park → Museum of Science and Industry');
    } else {
      console.log('   Venue user exists for James Park');
    }

    const raExists = await supabase.from('user_role_assignments')
      .select('id').eq('user_id', userIds['james.park@sciencediscovery.org']).limit(1);
    if (raExists.data?.length) {
      await supabase.from('user_role_assignments')
        .update({ organization_id: msiVenue.venue.id })
        .eq('user_id', userIds['james.park@sciencediscovery.org']);
    }
  }

  if (artVenue && userIds['lisa.wong@artinstitute.org']) {
    const { data: existingVU } = await supabase.from('venue_users')
      .select('id').eq('user_id', userIds['lisa.wong@artinstitute.org']).limit(1);

    if (!existingVU?.length) {
      const { error } = await supabase.from('venue_users').insert({
        venue_id: artVenue.venue.id,
        user_id: userIds['lisa.wong@artinstitute.org'],
        role: 'administrator',
      });
      if (error) console.error('   ERROR Art Institute venue user:', error.message);
      else console.log('   ✓ Lisa Wong → Art Institute of Chicago');
    } else {
      console.log('   Venue user exists for Lisa Wong');
    }

    const raExists = await supabase.from('user_role_assignments')
      .select('id').eq('user_id', userIds['lisa.wong@artinstitute.org']).limit(1);
    if (raExists.data?.length) {
      await supabase.from('user_role_assignments')
        .update({ organization_id: artVenue.venue.id })
        .eq('user_id', userIds['lisa.wong@artinstitute.org']);
    } else {
      await supabase.from('user_role_assignments').insert({
        id: randomUUID(),
        user_id: userIds['lisa.wong@artinstitute.org'],
        role_id: ROLE_IDS.venue_admin,
        organization_type: 'venue',
        organization_id: artVenue.venue.id,
        is_active: true,
      });
    }
  }

  console.log('\n10. Creating venue bookings...');

  if (confirmedTrip && msiVenue) {
    const { error } = await supabase.from('venue_bookings').upsert({
      id: 'c0000000-0000-0000-0001-000000000001',
      trip_id: confirmedTrip.id,
      venue_id: msiVenue.venue.id,
      experience_id: confirmedTrip.experience_id,
      scheduled_date: confirmedTrip.trip_date,
      start_time: '09:30:00',
      end_time: '12:30:00',
      student_count: 22,
      chaperone_count: 3,
      status: 'confirmed',
      confirmation_number: 'MSI-2026-0415',
      quoted_price_cents: 22 * 1800,
      venue_notes: 'Group of 22 students, 5th grade. 3 chaperones.',
    }, { onConflict: 'id' });
    if (error) console.error('   ERROR booking:', error.message);
    else console.log('   ✓ Booking for Sarah\'s confirmed trip at MSI');
  }

  if (rachelConfirmed && nycExps[0]) {
    const { error } = await supabase.from('venue_bookings').upsert({
      id: 'c0000000-0000-0000-0002-000000000001',
      trip_id: rachelConfirmed.id,
      venue_id: nycExps[0].venue?.id,
      experience_id: rachelConfirmed.experience_id,
      scheduled_date: rachelConfirmed.trip_date,
      start_time: '10:00:00',
      end_time: '13:00:00',
      student_count: 24,
      chaperone_count: 4,
      status: 'confirmed',
      confirmation_number: 'AMNH-2026-0310',
      quoted_price_cents: 24 * 2200,
      venue_notes: 'Group of 24 students, 6th grade. 4 chaperones.',
    }, { onConflict: 'id' });
    if (error) console.error('   ERROR NYC booking:', error.message);
    else console.log('   ✓ Booking for Rachel\'s confirmed trip');
  }

  console.log('\n=== VERIFICATION ===');
  
  const { count: schoolCount } = await supabase.from('schools').select('*', { count: 'exact', head: true });
  const { count: teacherCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
  const { count: rosterCount } = await supabase.from('rosters').select('*', { count: 'exact', head: true });
  const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
  const { count: tripCount } = await supabase.from('trips').select('*', { count: 'exact', head: true });
  const { count: slipCount } = await supabase.from('permission_slips').select('*', { count: 'exact', head: true });
  const { count: venueCount } = await supabase.from('venues').select('*', { count: 'exact', head: true });
  const { count: bookingCount } = await supabase.from('venue_bookings').select('*', { count: 'exact', head: true });

  console.log(`Schools: ${schoolCount}`);
  console.log(`Teachers: ${teacherCount}`);
  console.log(`Rosters: ${rosterCount}`);
  console.log(`Students: ${studentCount}`);
  console.log(`Trips: ${tripCount}`);
  console.log(`Permission Slips: ${slipCount}`);
  console.log(`Venues: ${venueCount}`);
  console.log(`Bookings: ${bookingCount}`);

  console.log('\n=== DEMO ACCOUNTS ===');
  console.log('All passwords: TripSlip2026!');
  console.log('');
  console.log('TEACHERS:');
  console.log('  sarah.chen@lincolnelementary.edu - Experienced teacher, 4 trips (completed/approved/pending/confirmed), 22 students');
  console.log('  mike.johnson@lincolnelementary.edu - New teacher, 1 draft trip, 20 students');
  console.log('  rachel.kim@riverside.edu - NYC teacher, 3 trips (confirmed/approved/completed), 44 students across 2 grades');
  console.log('  david.martinez@sunset.edu - LA teacher, 2 draft trips, 22 students');
  console.log('');
  console.log('SCHOOL ADMINS:');
  console.log('  patricia.reeves@lincolnelementary.edu - Lincoln Elementary admin (sees Sarah & Mike\'s trips)');
  console.log('  robert.taylor@riverside.edu - Riverside Middle School admin (sees Rachel\'s trips)');
  console.log('');
  console.log('VENUE ADMINS:');
  console.log('  james.park@sciencediscovery.org - Museum of Science & Industry (has active bookings)');
  console.log('  lisa.wong@artinstitute.org - Art Institute of Chicago (new venue, no bookings)');
  console.log('');
  console.log('PARENTS:');
  console.log('  maria.garcia@gmail.com - Has kids on 2 of Sarah\'s trips, all paid');
  console.log('  tom.wilson@gmail.com - Signed but hasn\'t paid for Sarah\'s confirmed trip');
  console.log('  amy.chen@outlook.com - Completed trip, everything signed & paid');
  console.log('  jennifer.patel@gmail.com - Rachel\'s trip, signed & paid');
  console.log('');
  console.log('Done!');
}

seed().catch(console.error);
