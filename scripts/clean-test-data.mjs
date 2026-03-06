import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function count(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return `error: ${error.message}`;
  return count;
}

async function run() {
  console.log('=== TripSlip Database Cleanup ===\n');

  console.log('--- BEFORE cleanup ---');
  const tables = ['venues', 'experiences', 'pricing_tiers', 'teachers', 'rosters', 'students',
    'trips', 'permission_slips', 'payments', 'parents', 'student_parents', 'venue_users',
    'schools', 'venue_categories', 'venue_category_assignments'];
  for (const t of tables) {
    console.log(`  ${t}: ${await count(t)}`);
  }

  console.log('\n--- Step 1: Find test venues ---');
  const { data: testVenues } = await supabase
    .from('venues')
    .select('id, name')
    .or('name.ilike.%test%,name.ilike.%Test Venue%');
  console.log(`  Found ${testVenues?.length || 0} test venues`);

  if (testVenues?.length) {
    const venueIds = testVenues.map(v => v.id);

    const { data: testExps } = await supabase
      .from('experiences')
      .select('id')
      .in('venue_id', venueIds);
    const expIds = testExps?.map(e => e.id) || [];

    if (expIds.length) {
      const { error: ptErr } = await supabase
        .from('pricing_tiers')
        .delete()
        .in('experience_id', expIds);
      console.log(`  Deleted pricing_tiers for test experiences: ${ptErr?.message || 'OK'}`);

      const { data: testTrips } = await supabase
        .from('trips')
        .select('id')
        .in('experience_id', expIds);
      const tripIds = testTrips?.map(t => t.id) || [];

      if (tripIds.length) {
        const { data: testSlips } = await supabase
          .from('permission_slips')
          .select('id')
          .in('trip_id', tripIds);
        const slipIds = testSlips?.map(s => s.id) || [];

        if (slipIds.length) {
          await supabase.from('payments').delete().in('permission_slip_id', slipIds);
          await supabase.from('documents').delete().in('permission_slip_id', slipIds);
          await supabase.from('permission_slips').delete().in('trip_id', tripIds);
          console.log(`  Deleted payments, documents, slips for ${tripIds.length} test trips`);
        }

        await supabase.from('trip_approvals').delete().in('trip_id', tripIds);
        await supabase.from('trips').delete().in('experience_id', expIds);
        console.log(`  Deleted ${tripIds.length} test trips`);
      }

      await supabase.from('experience_forms').delete().in('experience_id', expIds);
      await supabase.from('experiences').delete().in('venue_id', venueIds);
      console.log(`  Deleted ${expIds.length} test experiences`);
    }

    await supabase.from('venue_category_assignments').delete().in('venue_id', venueIds);
    await supabase.from('venue_users').delete().in('venue_id', venueIds);
    await supabase.from('venue_photos').delete().in('venue_id', venueIds);
    await supabase.from('venue_videos').delete().in('venue_id', venueIds);
    await supabase.from('venue_forms').delete().in('venue_id', venueIds);
    await supabase.from('venue_reviews').delete().in('venue_id', venueIds);
    await supabase.from('venue_claim_requests').delete().in('venue_id', venueIds);
    await supabase.from('venue_bookings').delete().in('venue_id', venueIds);
    await supabase.from('venues').delete().in('id', venueIds);
    console.log(`  Deleted ${venueIds.length} test venues`);
  }

  console.log('\n--- Step 2: Find test teachers (no user_id) ---');
  const { data: testTeachers } = await supabase
    .from('teachers')
    .select('id')
    .is('user_id', null);
  console.log(`  Found ${testTeachers?.length || 0} teachers with null user_id`);

  if (testTeachers?.length) {
    const teacherIds = testTeachers.map(t => t.id);

    const { data: testRosters } = await supabase
      .from('rosters')
      .select('id')
      .in('teacher_id', teacherIds);
    const rosterIds = testRosters?.map(r => r.id) || [];

    if (rosterIds.length) {
      const { data: rosterStudents } = await supabase
        .from('students')
        .select('id')
        .in('roster_id', rosterIds);
      const studentIds = rosterStudents?.map(s => s.id) || [];

      if (studentIds.length) {
        await supabase.from('student_parents').delete().in('student_id', studentIds);
        
        const { data: studentSlips } = await supabase
          .from('permission_slips')
          .select('id')
          .in('student_id', studentIds);
        const slipIds = studentSlips?.map(s => s.id) || [];
        
        if (slipIds.length) {
          await supabase.from('payments').delete().in('permission_slip_id', slipIds);
          await supabase.from('documents').delete().in('permission_slip_id', slipIds);
          await supabase.from('permission_slips').delete().in('student_id', studentIds);
        }

        await supabase.from('students').delete().in('roster_id', rosterIds);
        console.log(`  Deleted ${studentIds.length} students from test rosters`);
      }

      await supabase.from('rosters').delete().in('teacher_id', teacherIds);
      console.log(`  Deleted ${rosterIds.length} test rosters`);
    }

    const { data: teacherTrips } = await supabase
      .from('trips')
      .select('id')
      .in('teacher_id', teacherIds);

    if (teacherTrips?.length) {
      const tripIds = teacherTrips.map(t => t.id);
      const { data: tripSlips } = await supabase
        .from('permission_slips')
        .select('id')
        .in('trip_id', tripIds);
      const slipIds = tripSlips?.map(s => s.id) || [];

      if (slipIds.length) {
        await supabase.from('payments').delete().in('permission_slip_id', slipIds);
        await supabase.from('documents').delete().in('permission_slip_id', slipIds);
        await supabase.from('permission_slips').delete().in('trip_id', tripIds);
      }
      await supabase.from('trip_approvals').delete().in('trip_id', tripIds);
      await supabase.from('trips').delete().in('teacher_id', teacherIds);
      console.log(`  Deleted ${teacherTrips.length} trips from test teachers`);
    }

    await supabase.from('teachers').delete().in('id', teacherIds);
    console.log(`  Deleted ${teacherIds.length} test teachers`);
  }

  console.log('\n--- Step 3: Clean orphaned parents with no linked students ---');
  const { data: allParents } = await supabase.from('parents').select('id');
  if (allParents?.length) {
    const { data: linkedParents } = await supabase.from('student_parents').select('parent_id');
    const linkedIds = new Set(linkedParents?.map(lp => lp.parent_id) || []);
    const orphanedParents = allParents.filter(p => !linkedIds.has(p.id));
    if (orphanedParents.length) {
      await supabase.from('parents').delete().in('id', orphanedParents.map(p => p.id));
      console.log(`  Deleted ${orphanedParents.length} orphaned parents`);
    } else {
      console.log('  No orphaned parents found');
    }
  }

  console.log('\n--- AFTER cleanup ---');
  for (const t of tables) {
    console.log(`  ${t}: ${await count(t)}`);
  }

  console.log('\n=== Cleanup complete ===');
}

run().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
