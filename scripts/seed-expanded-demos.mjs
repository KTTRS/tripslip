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

async function ensureAuthUser(email, firstName, lastName) {
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage });
    if (listErr) { console.error(`  ERROR listing users page ${page}:`, listErr.message); break; }
    const found = existing?.users?.find(u => u.email === email);
    if (found) return found.id;
    if (!existing?.users?.length || existing.users.length < perPage) break;
    page++;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (error) {
    console.error(`  ERROR creating ${email}:`, error.message);
    return null;
  }
  return data.user.id;
}

async function seed() {
  console.log('=== TripSlip Expanded Demo Data ===\n');

  console.log('1. Creating parent records with auth accounts...');

  const parentDefs = [
    { email: 'maria.garcia@gmail.com', first: 'Maria', last: 'Garcia', phone: '312-555-1001', language: 'es' },
    { email: 'tom.wilson@gmail.com', first: 'Tom', last: 'Wilson', phone: '312-555-1002', language: 'en' },
    { email: 'amy.chen@outlook.com', first: 'Amy', last: 'Chen', phone: '312-555-1003', language: 'en' },
    { email: 'jennifer.patel@gmail.com', first: 'Jennifer', last: 'Patel', phone: '212-555-1004', language: 'en' },
    { email: 'carlos.ramirez@gmail.com', first: 'Carlos', last: 'Ramirez', phone: '312-555-1005', language: 'es' },
    { email: 'samantha.brown@yahoo.com', first: 'Samantha', last: 'Brown', phone: '312-555-1006', language: 'en' },
    { email: 'kenji.tanaka@gmail.com', first: 'Kenji', last: 'Tanaka', phone: '503-555-1007', language: 'en' },
    { email: 'fatima.hassan@gmail.com', first: 'Fatima', last: 'Hassan', phone: '212-555-1008', language: 'ar' },
    { email: 'david.oconnor@gmail.com', first: 'David', last: "O'Connor", phone: '215-555-1009', language: 'en' },
    { email: 'priya.sharma@outlook.com', first: 'Priya', last: 'Sharma', phone: '619-555-1010', language: 'en' },
  ];

  const parentRecords = {};

  for (const p of parentDefs) {
    const userId = await ensureAuthUser(p.email, p.first, p.last);

    const { data: existing } = await supabase.from('parents')
      .select('id').eq('email', p.email).limit(1);

    if (existing?.length) {
      parentRecords[p.email] = existing[0].id;
      if (userId) {
        await supabase.from('parents').update({ user_id: userId }).eq('id', existing[0].id);
      }
      console.log(`  Exists: ${p.first} ${p.last}`);
    } else {
      const parentId = randomUUID();
      const { error } = await supabase.from('parents').insert({
        id: parentId,
        user_id: userId,
        first_name: p.first,
        last_name: p.last,
        email: p.email,
        phone: p.phone,
        language: p.language,
      });
      if (error) console.error(`  ERROR ${p.email}:`, error.message);
      else {
        parentRecords[p.email] = parentId;
        console.log(`  + ${p.first} ${p.last} (${p.language})`);
      }
    }

    if (userId) {
      const schoolForParent = {
        'maria.garcia@gmail.com': SCHOOL_IDS.lincoln,
        'tom.wilson@gmail.com': SCHOOL_IDS.lincoln,
        'amy.chen@outlook.com': SCHOOL_IDS.lincoln,
        'carlos.ramirez@gmail.com': SCHOOL_IDS.lincoln,
        'samantha.brown@yahoo.com': SCHOOL_IDS.lincoln,
        'kenji.tanaka@gmail.com': SCHOOL_IDS.lincoln,
        'jennifer.patel@gmail.com': SCHOOL_IDS.riverside,
        'fatima.hassan@gmail.com': SCHOOL_IDS.riverside,
        'david.oconnor@gmail.com': SCHOOL_IDS.riverside,
        'priya.sharma@outlook.com': SCHOOL_IDS.sunset,
      };
      const { data: ra } = await supabase.from('user_role_assignments')
        .select('id').eq('user_id', userId).eq('role_id', ROLE_IDS.parent).limit(1);
      if (!ra?.length) {
        await supabase.from('user_role_assignments').insert({
          id: randomUUID(),
          user_id: userId,
          role_id: ROLE_IDS.parent,
          organization_type: 'school',
          organization_id: schoolForParent[p.email] || SCHOOL_IDS.lincoln,
          is_active: true,
        });
      }
    }
  }

  console.log('\n2. Linking parents to students...');

  const { data: sarah5thStudents } = await supabase.from('students')
    .select('id, first_name, last_name').eq('roster_id', ROSTER_IDS.sarah_5th).order('first_name');
  const { data: sarah4thStudents } = await supabase.from('students')
    .select('id, first_name, last_name').eq('roster_id', ROSTER_IDS.sarah_4th).order('first_name');
  const { data: mike3rdStudents } = await supabase.from('students')
    .select('id, first_name, last_name').eq('roster_id', ROSTER_IDS.mike_3rd).order('first_name');
  const { data: rachel6thStudents } = await supabase.from('students')
    .select('id, first_name, last_name').eq('roster_id', ROSTER_IDS.rachel_6th).order('first_name');
  const { data: david4thStudents } = await supabase.from('students')
    .select('id, first_name, last_name').eq('roster_id', ROSTER_IDS.david_4th).order('first_name');

  const parentStudentLinks = [];

  if (sarah5thStudents?.length >= 10) {
    for (let i = 0; i < 3; i++) parentStudentLinks.push({ parent: 'maria.garcia@gmail.com', student: sarah5thStudents[i], relationship: 'mother', primary: true });
    for (let i = 3; i < 6; i++) parentStudentLinks.push({ parent: 'tom.wilson@gmail.com', student: sarah5thStudents[i], relationship: 'father', primary: true });
    for (let i = 6; i < 9; i++) parentStudentLinks.push({ parent: 'amy.chen@outlook.com', student: sarah5thStudents[i], relationship: 'mother', primary: true });
    for (let i = 9; i < 12; i++) parentStudentLinks.push({ parent: 'carlos.ramirez@gmail.com', student: sarah5thStudents[i], relationship: 'father', primary: true });
    for (let i = 12; i < 15; i++) parentStudentLinks.push({ parent: 'samantha.brown@yahoo.com', student: sarah5thStudents[i], relationship: 'mother', primary: true });
  }

  if (sarah4thStudents?.length >= 6) {
    parentStudentLinks.push({ parent: 'maria.garcia@gmail.com', student: sarah4thStudents[0], relationship: 'mother', primary: true });
    parentStudentLinks.push({ parent: 'tom.wilson@gmail.com', student: sarah4thStudents[1], relationship: 'father', primary: true });
    parentStudentLinks.push({ parent: 'samantha.brown@yahoo.com', student: sarah4thStudents[2], relationship: 'mother', primary: true });
  }

  if (rachel6thStudents?.length >= 8) {
    for (let i = 0; i < 3; i++) parentStudentLinks.push({ parent: 'jennifer.patel@gmail.com', student: rachel6thStudents[i], relationship: 'mother', primary: true });
    for (let i = 3; i < 6; i++) parentStudentLinks.push({ parent: 'fatima.hassan@gmail.com', student: rachel6thStudents[i], relationship: 'mother', primary: true });
    for (let i = 6; i < 8; i++) parentStudentLinks.push({ parent: 'david.oconnor@gmail.com', student: rachel6thStudents[i], relationship: 'father', primary: true });
  }

  if (mike3rdStudents?.length >= 4) {
    for (let i = 0; i < 2; i++) parentStudentLinks.push({ parent: 'kenji.tanaka@gmail.com', student: mike3rdStudents[i], relationship: 'father', primary: true });
    for (let i = 2; i < 4; i++) parentStudentLinks.push({ parent: 'carlos.ramirez@gmail.com', student: mike3rdStudents[i], relationship: 'father', primary: true });
  }

  if (david4thStudents?.length >= 4) {
    for (let i = 0; i < 2; i++) parentStudentLinks.push({ parent: 'priya.sharma@outlook.com', student: david4thStudents[i], relationship: 'mother', primary: true });
  }

  for (const link of parentStudentLinks) {
    const parentId = parentRecords[link.parent];
    if (!parentId || !link.student) continue;

    const { data: existing } = await supabase.from('student_parents')
      .select('student_id').eq('parent_id', parentId).eq('student_id', link.student.id).limit(1);
    if (existing?.length) continue;

    const { error } = await supabase.from('student_parents').insert({
      parent_id: parentId,
      student_id: link.student.id,
      relationship: link.relationship,
      primary_contact: link.primary,
    });
    if (error && !error.message.includes('duplicate')) {
      console.error(`  ERROR link ${link.parent} -> ${link.student.first_name}:`, error.message);
    }
  }
  console.log(`  Processed ${parentStudentLinks.length} parent-student links`);

  console.log('\n3. Adding more trips with diverse scenarios...');

  const { data: teachers } = await supabase.from('teachers').select('id, email, school_id');
  const { data: allExperiences } = await supabase.from('experiences')
    .select('id, title, venue_id, venue:venues(name, id)').limit(100);

  const sarahTeacher = teachers?.find(t => t.email === 'sarah.chen@lincolnelementary.edu');
  const mikeTeacher = teachers?.find(t => t.email === 'mike.johnson@lincolnelementary.edu');
  const rachelTeacher = teachers?.find(t => t.email === 'rachel.kim@riverside.edu');
  const davidTeacher = teachers?.find(t => t.email === 'david.martinez@sunset.edu');

  const newTrips = [];

  if (sarahTeacher && allExperiences?.length >= 6) {
    newTrips.push({
      id: 'd0000000-0000-0000-0001-000000000001',
      experience_id: allExperiences[4]?.id,
      teacher_id: sarahTeacher.id,
      trip_date: '2026-03-25',
      trip_time: '09:00:00',
      student_count: 22,
      status: 'completed',
      direct_link_token: randomUUID(),
      transportation: { type: 'district_bus', departureTime: '08:00', returnTime: '14:00', pickupLocation: 'Main entrance' },
      is_free: true,
      funding_model: 'school_funded',
      assistance_fund_cents: 0,
      label: 'Sarah - FREE completed trip (school-funded aquarium, Mar)',
    });

    newTrips.push({
      id: 'd0000000-0000-0000-0001-000000000002',
      experience_id: allExperiences[5]?.id,
      teacher_id: sarahTeacher.id,
      trip_date: '2026-09-15',
      trip_time: '09:30:00',
      student_count: 18,
      status: 'approved',
      direct_link_token: randomUUID(),
      transportation: { type: 'walking', departureTime: '09:00', returnTime: '12:00', pickupLocation: 'Front door' },
      is_free: false,
      funding_model: 'parent_pay',
      assistance_fund_cents: 8000,
      label: 'Sarah - Fall trip (Art workshop, big assistance fund)',
    });

    newTrips.push({
      id: 'd0000000-0000-0000-0001-000000000003',
      experience_id: allExperiences[6]?.id || allExperiences[0]?.id,
      teacher_id: sarahTeacher.id,
      trip_date: '2026-12-10',
      trip_time: '10:00:00',
      student_count: 22,
      status: 'cancelled',
      direct_link_token: randomUUID(),
      transportation: { type: 'charter_bus', departureTime: '09:00', returnTime: '15:00', pickupLocation: 'Parking lot' },
      is_free: false,
      funding_model: 'parent_pay',
      assistance_fund_cents: 0,
      label: 'Sarah - CANCELLED trip (weather, Dec)',
    });
  }

  if (mikeTeacher && allExperiences?.length >= 4) {
    newTrips.push({
      id: 'd0000000-0000-0000-0002-000000000001',
      experience_id: allExperiences[2]?.id,
      teacher_id: mikeTeacher.id,
      trip_date: '2026-04-22',
      trip_time: '09:00:00',
      student_count: 20,
      status: 'confirmed',
      direct_link_token: randomUUID(),
      transportation: { type: 'district_bus', departureTime: '08:30', returnTime: '13:30', pickupLocation: 'Main entrance' },
      is_free: false,
      funding_model: 'parent_pay',
      assistance_fund_cents: 3500,
      label: 'Mike - Earth Day Zoo trip (confirmed, slips going out)',
    });

    newTrips.push({
      id: 'd0000000-0000-0000-0002-000000000002',
      experience_id: allExperiences[3]?.id,
      teacher_id: mikeTeacher.id,
      trip_date: '2026-02-14',
      trip_time: '10:00:00',
      student_count: 20,
      status: 'completed',
      direct_link_token: randomUUID(),
      transportation: { type: 'parent_carpool', departureTime: '09:30', returnTime: '14:00', pickupLocation: 'Parking lot' },
      is_free: true,
      funding_model: 'school_funded',
      assistance_fund_cents: 0,
      label: 'Mike - completed FREE botanical trip (Feb)',
    });
  }

  if (rachelTeacher && allExperiences?.length >= 8) {
    newTrips.push({
      id: 'd0000000-0000-0000-0003-000000000001',
      experience_id: allExperiences[7]?.id,
      teacher_id: rachelTeacher.id,
      trip_date: '2026-05-05',
      trip_time: '08:30:00',
      student_count: 24,
      status: 'pending_approval',
      direct_link_token: randomUUID(),
      transportation: { type: 'subway', departureTime: '08:00', returnTime: '14:00', pickupLocation: 'School entrance' },
      is_free: false,
      funding_model: 'split_funded',
      assistance_fund_cents: 10000,
      label: 'Rachel - pending history museum trip (split-funded)',
    });
  }

  if (davidTeacher && allExperiences?.length >= 10) {
    newTrips.push({
      id: 'd0000000-0000-0000-0004-000000000001',
      experience_id: allExperiences[8]?.id,
      teacher_id: davidTeacher.id,
      trip_date: '2026-04-10',
      trip_time: '09:00:00',
      student_count: 22,
      status: 'confirmed',
      direct_link_token: randomUUID(),
      transportation: { type: 'charter_bus', departureTime: '08:00', returnTime: '15:00', pickupLocation: 'Bus loop' },
      is_free: false,
      funding_model: 'parent_pay',
      assistance_fund_cents: 5000,
      label: 'David - LA aquarium confirmed trip (Apr)',
    });

    newTrips.push({
      id: 'd0000000-0000-0000-0004-000000000002',
      experience_id: allExperiences[9]?.id,
      teacher_id: davidTeacher.id,
      trip_date: '2026-01-28',
      trip_time: '10:00:00',
      student_count: 22,
      status: 'completed',
      direct_link_token: randomUUID(),
      transportation: { type: 'district_bus', departureTime: '09:00', returnTime: '13:00', pickupLocation: 'Main entrance' },
      is_free: false,
      funding_model: 'parent_pay',
      assistance_fund_cents: 2000,
      label: 'David - completed LA science trip (Jan)',
    });
  }

  for (const trip of newTrips) {
    if (!trip.experience_id) {
      console.log(`  Skipping: ${trip.label} - no experience`);
      continue;
    }
    const { label, ...tripData } = trip;
    const { error } = await supabase.from('trips').upsert(tripData, { onConflict: 'id' });
    if (error) console.error(`  ERROR ${label}:`, error.message);
    else console.log(`  + ${label}`);
  }

  console.log('\n4. Creating permission slips for new trips...');

  const allRosterStudents = {
    sarah_5th: sarah5thStudents || [],
    sarah_4th: sarah4thStudents || [],
    mike_3rd: mike3rdStudents || [],
    rachel_6th: rachel6thStudents || [],
    david_4th: david4thStudents || [],
  };

  const newSlips = [];

  const sarahFreeTrip = newTrips.find(t => t.id === 'd0000000-0000-0000-0001-000000000001');
  if (sarahFreeTrip && allRosterStudents.sarah_5th.length) {
    for (let i = 0; i < allRosterStudents.sarah_5th.length; i++) {
      const s = allRosterStudents.sarah_5th[i];
      newSlips.push({
        id: randomUUID(),
        trip_id: sarahFreeTrip.id,
        student_id: s.id,
        status: 'signed',
        signed_at: '2026-03-20T10:00:00Z',
        form_data: {
          childName: `${s.first_name} ${s.last_name}`,
          childGrade: '5',
          parentName: i < 3 ? 'Maria Garcia' : (i < 6 ? 'Tom Wilson' : `Parent of ${s.first_name}`),
          parentEmail: i < 3 ? 'maria.garcia@gmail.com' : (i < 6 ? 'tom.wilson@gmail.com' : `parent.${s.last_name.toLowerCase()}@email.com`),
          parentPhone: `312-555-${String(9000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${s.first_name}`,
          emergencyPhone: `312-555-${String(9100 + i).padStart(4, '0')}`,
          allergies: i === 2 ? 'Tree nut allergy - carries EpiPen' : (i === 8 ? 'Lactose intolerant' : 'None'),
          medications: i === 2 ? 'EpiPen (auto-injector)' : (i === 14 ? 'Inhaler for exercise-induced asthma' : 'None'),
          dietaryRestrictions: i === 5 ? 'Vegetarian' : (i === 11 ? 'Halal' : (i === 15 ? 'Gluten-free' : 'None')),
        },
        signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      });
    }
  }

  const sarahFallTrip = newTrips.find(t => t.id === 'd0000000-0000-0000-0001-000000000002');
  if (sarahFallTrip && allRosterStudents.sarah_4th.length) {
    for (let i = 0; i < allRosterStudents.sarah_4th.length; i++) {
      const s = allRosterStudents.sarah_4th[i];
      let status, signedAt = null;

      if (i < 5) {
        status = 'paid';
        signedAt = new Date(Date.now() - (i + 3) * 86400000).toISOString();
      } else if (i < 8) {
        status = 'signed_pending_payment';
        signedAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      } else if (i < 12) {
        status = 'sent';
      } else {
        status = 'pending';
      }

      newSlips.push({
        id: randomUUID(),
        trip_id: sarahFallTrip.id,
        student_id: s.id,
        status,
        signed_at: signedAt,
        form_data: signedAt ? {
          childName: `${s.first_name} ${s.last_name}`,
          childGrade: '4',
          parentName: i === 0 ? 'Maria Garcia' : (i === 1 ? 'Tom Wilson' : (i === 2 ? 'Samantha Brown' : `Parent of ${s.first_name}`)),
          parentEmail: i === 0 ? 'maria.garcia@gmail.com' : (i === 1 ? 'tom.wilson@gmail.com' : (i === 2 ? 'samantha.brown@yahoo.com' : `parent@email.com`)),
          parentPhone: `312-555-${String(8000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${s.first_name}`,
          emergencyPhone: `312-555-${String(8100 + i).padStart(4, '0')}`,
          allergies: i === 4 ? 'Severe peanut allergy' : 'None',
          medications: i === 4 ? 'EpiPen, Benadryl' : 'None',
        } : null,
        signature_data: signedAt ? 'data:image/png;base64,signed' : null,
        financial_assistance_requested: i === 9 || i === 10,
        assistance_amount_covered: (i === 9 || i === 10) ? 2000 : null,
      });
    }
  }

  const mikeConfirmedTrip = newTrips.find(t => t.id === 'd0000000-0000-0000-0002-000000000001');
  if (mikeConfirmedTrip && allRosterStudents.mike_3rd.length) {
    for (let i = 0; i < allRosterStudents.mike_3rd.length; i++) {
      const s = allRosterStudents.mike_3rd[i];
      let status, signedAt = null;

      if (i < 3) {
        status = 'paid';
        signedAt = new Date(Date.now() - (i + 5) * 86400000).toISOString();
      } else if (i < 6) {
        status = 'signed';
        signedAt = new Date(Date.now() - (i + 2) * 86400000).toISOString();
      } else if (i < 10) {
        status = 'sent';
      } else {
        status = 'pending';
      }

      newSlips.push({
        id: randomUUID(),
        trip_id: mikeConfirmedTrip.id,
        student_id: s.id,
        status,
        signed_at: signedAt,
        magic_link_token: randomUUID(),
        token_expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        form_data: signedAt ? {
          childName: `${s.first_name} ${s.last_name}`,
          childGrade: '3',
          parentName: i < 2 ? 'Kenji Tanaka' : (i < 4 ? 'Carlos Ramirez' : `Parent of ${s.first_name}`),
          parentEmail: i < 2 ? 'kenji.tanaka@gmail.com' : (i < 4 ? 'carlos.ramirez@gmail.com' : `parent@email.com`),
          parentPhone: `312-555-${String(7000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${s.first_name}`,
          emergencyPhone: `312-555-${String(7100 + i).padStart(4, '0')}`,
          allergies: i === 1 ? 'Egg allergy' : 'None',
          medications: 'None',
        } : null,
        signature_data: signedAt ? 'data:image/png;base64,signed' : null,
      });
    }
  }

  const mikeFreeTrip = newTrips.find(t => t.id === 'd0000000-0000-0000-0002-000000000002');
  if (mikeFreeTrip && allRosterStudents.mike_3rd.length) {
    for (let i = 0; i < allRosterStudents.mike_3rd.length; i++) {
      const s = allRosterStudents.mike_3rd[i];
      newSlips.push({
        id: randomUUID(),
        trip_id: mikeFreeTrip.id,
        student_id: s.id,
        status: 'signed',
        signed_at: '2026-02-10T14:00:00Z',
        form_data: {
          childName: `${s.first_name} ${s.last_name}`,
          childGrade: '3',
          parentName: `Parent of ${s.first_name}`,
          parentEmail: `parent.${s.last_name.toLowerCase()}@email.com`,
          parentPhone: `312-555-${String(6000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${s.first_name}`,
          emergencyPhone: `312-555-${String(6100 + i).padStart(4, '0')}`,
          allergies: 'None',
          medications: 'None',
        },
        signature_data: 'data:image/png;base64,signed',
      });
    }
  }

  const davidConfTrip = newTrips.find(t => t.id === 'd0000000-0000-0000-0004-000000000001');
  if (davidConfTrip && allRosterStudents.david_4th.length) {
    for (let i = 0; i < allRosterStudents.david_4th.length; i++) {
      const s = allRosterStudents.david_4th[i];
      let status, signedAt = null;

      if (i < 10) {
        status = 'paid';
        signedAt = new Date(Date.now() - (i + 2) * 86400000).toISOString();
      } else if (i < 14) {
        status = 'signed_pending_payment';
        signedAt = new Date(Date.now() - 86400000).toISOString();
      } else if (i < 18) {
        status = 'sent';
      } else {
        status = 'pending';
      }

      newSlips.push({
        id: randomUUID(),
        trip_id: davidConfTrip.id,
        student_id: s.id,
        status,
        signed_at: signedAt,
        magic_link_token: randomUUID(),
        token_expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        form_data: signedAt ? {
          childName: `${s.first_name} ${s.last_name}`,
          childGrade: '4',
          parentName: i < 2 ? 'Priya Sharma' : `Parent of ${s.first_name}`,
          parentEmail: i < 2 ? 'priya.sharma@outlook.com' : `parent@email.com`,
          parentPhone: `310-555-${String(5000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${s.first_name}`,
          emergencyPhone: `310-555-${String(5100 + i).padStart(4, '0')}`,
          allergies: i === 3 ? 'Sesame allergy' : (i === 12 ? 'Asthma - carries inhaler' : 'None'),
          medications: i === 3 ? 'Antihistamine' : (i === 12 ? 'Albuterol inhaler' : 'None'),
          specialNeeds: i === 7 ? 'Wheelchair accessible required' : undefined,
        } : null,
        signature_data: signedAt ? 'data:image/png;base64,signed' : null,
        financial_assistance_requested: i === 16 || i === 17,
        assistance_amount_covered: (i === 16 || i === 17) ? 1800 : null,
      });
    }
  }

  const davidCompletedTrip = newTrips.find(t => t.id === 'd0000000-0000-0000-0004-000000000002');
  if (davidCompletedTrip && allRosterStudents.david_4th.length) {
    for (let i = 0; i < allRosterStudents.david_4th.length; i++) {
      const s = allRosterStudents.david_4th[i];
      newSlips.push({
        id: randomUUID(),
        trip_id: davidCompletedTrip.id,
        student_id: s.id,
        status: 'paid',
        signed_at: '2026-01-22T11:00:00Z',
        form_data: {
          childName: `${s.first_name} ${s.last_name}`,
          childGrade: '4',
          parentName: `Parent of ${s.first_name}`,
          parentEmail: `parent.${s.last_name.toLowerCase()}@email.com`,
          parentPhone: `310-555-${String(4000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${s.first_name}`,
          emergencyPhone: `310-555-${String(4100 + i).padStart(4, '0')}`,
          allergies: 'None',
          medications: 'None',
        },
        signature_data: 'data:image/png;base64,signed',
      });
    }
  }

  const cancelledTrip = newTrips.find(t => t.id === 'd0000000-0000-0000-0001-000000000003');
  if (cancelledTrip && allRosterStudents.sarah_5th.length) {
    for (let i = 0; i < Math.min(allRosterStudents.sarah_5th.length, 15); i++) {
      const s = allRosterStudents.sarah_5th[i];
      newSlips.push({
        id: randomUUID(),
        trip_id: cancelledTrip.id,
        student_id: s.id,
        status: 'cancelled',
        signed_at: i < 8 ? '2026-11-25T10:00:00Z' : null,
        form_data: i < 8 ? {
          childName: `${s.first_name} ${s.last_name}`,
          childGrade: '5',
          parentName: `Parent of ${s.first_name}`,
          parentEmail: `parent@email.com`,
          parentPhone: `312-555-${String(3000 + i).padStart(4, '0')}`,
          emergencyContact: `Emergency for ${s.first_name}`,
          emergencyPhone: `312-555-${String(3100 + i).padStart(4, '0')}`,
          allergies: 'None',
          medications: 'None',
        } : null,
        signature_data: i < 8 ? 'data:image/png;base64,signed' : null,
      });
    }
  }

  await supabase.from('permission_slips').delete().in('trip_id', newTrips.map(t => t.id));

  if (newSlips.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < newSlips.length; i += batchSize) {
      const batch = newSlips.slice(i, i + batchSize);
      const { error } = await supabase.from('permission_slips').insert(batch);
      if (error) console.error(`  ERROR slips batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      else console.log(`  + ${batch.length} permission slips (batch ${Math.floor(i / batchSize) + 1})`);
    }
  }

  console.log('\n5. Creating payment records...');

  const newTripIds = newTrips.map(t => t.id);
  const { data: paidSlips } = await supabase.from('permission_slips')
    .select('id, trip_id, student_id, form_data, trips!inner(is_free, funding_model)')
    .eq('status', 'paid')
    .in('trip_id', newTripIds)
    .limit(200);

  const payments = [];
  if (paidSlips?.length) {
    for (const slip of paidSlips) {
      if (slip.trips?.is_free) continue;

      const parentEmail = slip.form_data?.parentEmail;
      const parentId = parentEmail ? parentRecords[parentEmail] : null;

      const { data: existing } = await supabase.from('payments')
        .select('id').eq('permission_slip_id', slip.id).limit(1);
      if (existing?.length) continue;

      const baseCost = 1500 + Math.floor(Math.random() * 1500);

      payments.push({
        id: randomUUID(),
        permission_slip_id: slip.id,
        parent_id: parentId || null,
        amount_cents: baseCost,
        status: 'succeeded',
        stripe_payment_intent_id: `pi_demo_${randomUUID().substring(0, 12)}`,
        is_split_payment: false,
        paid_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
      });
    }
  }

  if (payments.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < payments.length; i += batchSize) {
      const batch = payments.slice(i, i + batchSize);
      const { error } = await supabase.from('payments').insert(batch);
      if (error) console.error(`  ERROR payments batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      else console.log(`  + ${batch.length} payments (batch ${Math.floor(i / batchSize) + 1})`);
    }
  }

  console.log('\n6. Adding more venue bookings...');

  const newBookings = [];

  for (const trip of newTrips) {
    if (!trip.experience_id) continue;
    if (trip.status === 'draft' || trip.status === 'cancelled') continue;

    const exp = allExperiences?.find(e => e.id === trip.experience_id);
    if (!exp?.venue?.id) continue;

    const bookingId = `d1${trip.id.substring(2)}`;
    let bookingStatus;
    if (trip.status === 'completed') bookingStatus = 'completed';
    else if (trip.status === 'confirmed') bookingStatus = 'confirmed';
    else if (trip.status === 'approved') bookingStatus = 'pending';
    else bookingStatus = 'pending';

    newBookings.push({
      id: bookingId,
      trip_id: trip.id,
      venue_id: exp.venue.id,
      experience_id: trip.experience_id,
      scheduled_date: trip.trip_date,
      start_time: trip.trip_time,
      end_time: (() => {
        const [h, m, s] = trip.trip_time.split(':').map(Number);
        return `${String(h + 3).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      })(),
      student_count: trip.student_count,
      chaperone_count: Math.ceil(trip.student_count / 8),
      status: bookingStatus,
      confirmation_number: bookingStatus === 'confirmed' || bookingStatus === 'completed'
        ? `BK-${trip.trip_date.replace(/-/g, '').substring(2)}`
        : null,
      quoted_price_cents: trip.student_count * (1500 + Math.floor(Math.random() * 1000)),
      venue_notes: `Group of ${trip.student_count} students. ${Math.ceil(trip.student_count / 8)} chaperones.`,
    });
  }

  for (const booking of newBookings) {
    const { error } = await supabase.from('venue_bookings').upsert(booking, { onConflict: 'id' });
    if (error) console.error(`  ERROR booking:`, error.message);
    else console.log(`  + Booking ${booking.confirmation_number || 'pending'} (${booking.status})`);
  }

  console.log('\n=== FINAL VERIFICATION ===');

  const counts = {};
  for (const table of ['schools', 'teachers', 'rosters', 'students', 'trips', 'permission_slips', 'venues', 'venue_bookings', 'parents', 'payments', 'student_parents']) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    counts[table] = count;
  }

  console.log('');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }

  const { data: tripsByStatus } = await supabase.from('trips')
    .select('status').order('status');

  const statusCounts = {};
  tripsByStatus?.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  console.log('\n  Trip statuses:', statusCounts);

  const { data: slipsByStatus } = await supabase.from('permission_slips')
    .select('status').order('status');

  const slipStatusCounts = {};
  slipsByStatus?.forEach(s => { slipStatusCounts[s.status] = (slipStatusCounts[s.status] || 0) + 1; });
  console.log('  Slip statuses:', slipStatusCounts);

  console.log('\n=== NEW DEMO ACCOUNTS ===');
  console.log('All passwords: TripSlip2026!\n');
  console.log('NEW PARENTS:');
  console.log('  carlos.ramirez@gmail.com - Spanish-speaking, kids at Lincoln (Sarah 5th) + Mike 3rd');
  console.log('  samantha.brown@yahoo.com - Kids at Lincoln (Sarah 5th + 4th)');
  console.log('  kenji.tanaka@gmail.com - Kids at Lincoln (Mike 3rd)');
  console.log('  fatima.hassan@gmail.com - Arabic-speaking, kids at Riverside (Rachel 6th)');
  console.log('  david.oconnor@gmail.com - Kids at Riverside (Rachel 6th)');
  console.log('  priya.sharma@outlook.com - Kids at Sunset (David 4th)');
  console.log('\nNEW TRIP SCENARIOS:');
  console.log('  FREE school-funded trip (Sarah, completed)');
  console.log('  Art workshop with big assistance fund (Sarah, approved)');
  console.log('  CANCELLED trip due to weather (Sarah)');
  console.log('  Earth Day Zoo trip with active slips going out (Mike, confirmed)');
  console.log('  FREE botanical garden trip (Mike, completed)');
  console.log('  Split-funded history museum trip (Rachel, pending_approval)');
  console.log('  LA aquarium trip with mixed slip statuses (David, confirmed)');
  console.log('  Completed paid LA science trip (David)');
  console.log('\nDone!');
}

seed().catch(console.error);
