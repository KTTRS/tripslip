import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const venueIds = {
  science: randomUUID(),
  zoo: randomUUID(),
  botanical: randomUUID(),
  history: randomUUID(),
  aquarium: randomUUID(),
  art: randomUUID(),
};

const expIds = {
  sci1: randomUUID(), sci2: randomUUID(),
  zoo1: randomUUID(), zoo2: randomUUID(),
  bot1: randomUUID(), bot2: randomUUID(),
  hist1: randomUUID(), hist2: randomUUID(),
  aqua1: randomUUID(), aqua2: randomUUID(),
  art1: randomUUID(), art2: randomUUID(),
};

const schoolId = randomUUID();
const rosterId = randomUUID();

const VENUES = [
  { id: venueIds.science, name: 'National Science Discovery Center', description: 'An interactive science museum featuring hands-on exhibits in physics, chemistry, biology, and astronomy. Perfect for STEM-focused field trips.', address: { street: '200 Museum Way', city: 'Denver', state: 'CO', zipCode: '80205', country: 'USA', coordinates: { lat: 39.7555, lng: -104.9734 } }, contact_email: 'fieldtrips@sciencediscovery.org', contact_phone: '303-555-0120', website: 'https://sciencediscovery.org', capacity_min: 15, capacity_max: 120, rating: 4.8, review_count: 142, verified: true, claimed: true },
  { id: venueIds.zoo, name: 'Riverside City Zoo & Wildlife Park', description: 'Home to over 3,000 animals from around the world. Educational programs include habitat tours, animal encounters, and conservation workshops.', address: { street: '4500 Riverside Dr', city: 'Portland', state: 'OR', zipCode: '97202', country: 'USA', coordinates: { lat: 45.5051, lng: -122.675 } }, contact_email: 'education@riversidezoo.org', contact_phone: '503-555-0134', website: 'https://riversidezoo.org', capacity_min: 20, capacity_max: 200, rating: 4.6, review_count: 231, verified: true, claimed: true },
  { id: venueIds.botanical, name: 'Greenleaf Botanical Gardens', description: 'Beautiful 45-acre botanical garden with themed gardens, a butterfly conservatory, and hands-on planting workshops for students of all ages.', address: { street: '1200 Garden Blvd', city: 'Austin', state: 'TX', zipCode: '78701', country: 'USA', coordinates: { lat: 30.2672, lng: -97.7431 } }, contact_email: 'tours@greenleafgardens.org', contact_phone: '512-555-0155', website: 'https://greenleafgardens.org', capacity_min: 10, capacity_max: 80, rating: 4.9, review_count: 97, verified: true, claimed: true },
  { id: venueIds.history, name: 'Heritage History Museum', description: 'A premier history museum with exhibits spanning from ancient civilizations to modern American history. Guided tours and living history programs available.', address: { street: '850 Independence Ave', city: 'Philadelphia', state: 'PA', zipCode: '19106', country: 'USA', coordinates: { lat: 39.9526, lng: -75.1652 } }, contact_email: 'education@heritagehistory.org', contact_phone: '215-555-0178', website: 'https://heritagehistory.org', capacity_min: 15, capacity_max: 100, rating: 4.7, review_count: 183, verified: true, claimed: true },
  { id: venueIds.aquarium, name: 'Pacific Coast Aquarium', description: 'State-of-the-art aquarium featuring marine habitats from tide pools to the deep ocean. Touch tanks, feeding demonstrations, and marine biology labs.', address: { street: '300 Harbor Way', city: 'San Diego', state: 'CA', zipCode: '92101', country: 'USA', coordinates: { lat: 32.7157, lng: -117.1611 } }, contact_email: 'groups@pacificaquarium.org', contact_phone: '619-555-0192', website: 'https://pacificaquarium.org', capacity_min: 20, capacity_max: 150, rating: 4.8, review_count: 276, verified: true, claimed: true },
  { id: venueIds.art, name: 'Creative Arts Learning Center', description: 'A dynamic arts education center offering painting, sculpture, digital media, and performing arts workshops. All materials provided for student groups.', address: { street: '75 Gallery Row', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA', coordinates: { lat: 41.8781, lng: -87.6298 } }, contact_email: 'bookings@creativearts.org', contact_phone: '312-555-0211', website: 'https://creativearts.org', capacity_min: 10, capacity_max: 60, rating: 4.7, review_count: 64, verified: true, claimed: true },
];

const EXPERIENCES = [
  { id: expIds.sci1, venue_id: venueIds.science, title: 'Rocket Science Workshop', description: 'Students design and launch model rockets while learning about aerodynamics, thrust, and Newton\'s laws of motion.', duration_minutes: 120, capacity: 35, min_students: 10, max_students: 35, grade_levels: ['3rd', '4th', '5th'], subjects: ['Science', 'Physics'], published: true, active: true, educational_objectives: ['Understand Newton\'s three laws of motion', 'Learn about aerodynamics and thrust', 'Apply the engineering design process'] },
  { id: expIds.sci2, venue_id: venueIds.science, title: 'Chemistry Lab Explorer', description: 'Hands-on chemistry experiments including safe chemical reactions, crystal growing, and pH testing.', duration_minutes: 90, capacity: 30, min_students: 8, max_students: 30, grade_levels: ['4th', '5th', '6th'], subjects: ['Science', 'Chemistry'], published: true, active: true, educational_objectives: ['Learn about chemical reactions', 'Understand pH and acidity', 'Practice lab safety procedures'] },
  { id: expIds.zoo1, venue_id: venueIds.zoo, title: 'Wildlife Conservation Tour', description: 'Guided tour of endangered species habitats with talks from zookeepers about conservation efforts and animal behavior.', duration_minutes: 150, capacity: 40, min_students: 15, max_students: 40, grade_levels: ['3rd', '4th', '5th', '6th'], subjects: ['Science', 'Biology', 'Environmental Studies'], published: true, active: true, educational_objectives: ['Understand endangered species and habitats', 'Learn about conservation biology', 'Explore animal behavior and adaptation'] },
  { id: expIds.zoo2, venue_id: venueIds.zoo, title: 'Junior Zookeeper Experience', description: 'Students shadow real zookeepers, help prepare animal enrichment activities, and learn about animal nutrition and care.', duration_minutes: 180, capacity: 20, min_students: 8, max_students: 20, grade_levels: ['5th', '6th'], subjects: ['Science', 'Biology'], published: true, active: true, educational_objectives: ['Learn about animal care and nutrition', 'Understand zookeeper responsibilities', 'Create animal enrichment activities'] },
  { id: expIds.bot1, venue_id: venueIds.botanical, title: 'Plant Science & Ecology Walk', description: 'Explore plant biology through a guided walk of themed gardens, followed by a hands-on seed planting activity.', duration_minutes: 120, capacity: 30, min_students: 10, max_students: 30, grade_levels: ['2nd', '3rd', '4th'], subjects: ['Science', 'Biology', 'Environmental Studies'], published: true, active: true, educational_objectives: ['Identify plant parts and their functions', 'Understand plant life cycles', 'Learn about ecosystems and biodiversity'] },
  { id: expIds.bot2, venue_id: venueIds.botanical, title: 'Butterfly Conservatory Adventure', description: 'Visit the tropical butterfly conservatory to observe metamorphosis stages, identify species, and learn about pollination.', duration_minutes: 90, capacity: 25, min_students: 8, max_students: 25, grade_levels: ['1st', '2nd', '3rd'], subjects: ['Science', 'Biology'], published: true, active: true, educational_objectives: ['Understand insect metamorphosis', 'Learn about pollination', 'Identify butterfly species and their habitats'] },
  { id: expIds.hist1, venue_id: venueIds.history, title: 'American Revolution Living History', description: 'Interactive living history program where students meet reenactors, handle replica artifacts, and experience colonial life.', duration_minutes: 150, capacity: 35, min_students: 15, max_students: 35, grade_levels: ['4th', '5th', '6th'], subjects: ['History', 'Social Studies'], published: true, active: true, educational_objectives: ['Understand causes of the American Revolution', 'Experience colonial daily life', 'Analyze primary source documents'] },
  { id: expIds.hist2, venue_id: venueIds.history, title: 'Ancient Civilizations Explorer', description: 'Journey through exhibits on Egypt, Greece, and Rome with hands-on activities including hieroglyphic writing and mosaic art.', duration_minutes: 120, capacity: 30, min_students: 10, max_students: 30, grade_levels: ['3rd', '4th', '5th'], subjects: ['History', 'Social Studies', 'Art'], published: true, active: true, educational_objectives: ['Compare ancient civilizations', 'Understand cultural contributions', 'Create art inspired by ancient techniques'] },
  { id: expIds.aqua1, venue_id: venueIds.aquarium, title: 'Ocean Ecosystems Deep Dive', description: 'Explore marine ecosystems from coral reefs to the deep ocean. Includes touch tank experience and feeding demonstration.', duration_minutes: 120, capacity: 40, min_students: 15, max_students: 40, grade_levels: ['3rd', '4th', '5th'], subjects: ['Science', 'Marine Biology', 'Environmental Studies'], published: true, active: true, educational_objectives: ['Understand ocean ecosystem layers', 'Learn about marine food webs', 'Explore ocean conservation challenges'] },
  { id: expIds.aqua2, venue_id: venueIds.aquarium, title: 'Marine Biology Lab', description: 'Work in a real marine biology lab: examine plankton under microscopes, test water quality, and study marine specimens.', duration_minutes: 150, capacity: 24, min_students: 10, max_students: 24, grade_levels: ['5th', '6th'], subjects: ['Science', 'Marine Biology'], published: true, active: true, educational_objectives: ['Use scientific equipment (microscopes, testing kits)', 'Understand water chemistry', 'Learn marine specimen identification'] },
  { id: expIds.art1, venue_id: venueIds.art, title: 'Masterpiece Workshop', description: 'Students study famous artworks, then create their own masterpieces using various media including watercolor, acrylic, and mixed media.', duration_minutes: 120, capacity: 25, min_students: 8, max_students: 25, grade_levels: ['2nd', '3rd', '4th', '5th'], subjects: ['Art', 'Art History'], published: true, active: true, educational_objectives: ['Study famous artworks and art movements', 'Experiment with different art media', 'Express creativity through original artwork'] },
  { id: expIds.art2, venue_id: venueIds.art, title: 'Digital Art & Animation Intro', description: 'Introduction to digital art using tablets and animation software. Students create short animated clips and digital illustrations.', duration_minutes: 150, capacity: 20, min_students: 8, max_students: 20, grade_levels: ['4th', '5th', '6th'], subjects: ['Art', 'Technology', 'Digital Media'], published: true, active: true, educational_objectives: ['Learn digital art fundamentals', 'Create simple animations', 'Understand the role of technology in art'] },
];

const PRICING_TIERS = [
  { experience_id: expIds.sci1, min_students: 1, max_students: 20, price_cents: 1800, free_chaperones: 2 },
  { experience_id: expIds.sci1, min_students: 21, max_students: 35, price_cents: 1500, free_chaperones: 3 },
  { experience_id: expIds.sci2, min_students: 1, max_students: 30, price_cents: 1400, free_chaperones: 2 },
  { experience_id: expIds.zoo1, min_students: 1, max_students: 25, price_cents: 2200, free_chaperones: 2 },
  { experience_id: expIds.zoo1, min_students: 26, max_students: 40, price_cents: 1900, free_chaperones: 3 },
  { experience_id: expIds.zoo2, min_students: 1, max_students: 20, price_cents: 2500, free_chaperones: 1 },
  { experience_id: expIds.bot1, min_students: 1, max_students: 30, price_cents: 1200, free_chaperones: 2 },
  { experience_id: expIds.bot2, min_students: 1, max_students: 25, price_cents: 1000, free_chaperones: 2 },
  { experience_id: expIds.hist1, min_students: 1, max_students: 35, price_cents: 1600, free_chaperones: 3 },
  { experience_id: expIds.hist2, min_students: 1, max_students: 30, price_cents: 1400, free_chaperones: 2 },
  { experience_id: expIds.aqua1, min_students: 1, max_students: 25, price_cents: 2000, free_chaperones: 2 },
  { experience_id: expIds.aqua1, min_students: 26, max_students: 40, price_cents: 1700, free_chaperones: 3 },
  { experience_id: expIds.aqua2, min_students: 1, max_students: 24, price_cents: 2200, free_chaperones: 2 },
  { experience_id: expIds.art1, min_students: 1, max_students: 25, price_cents: 1500, free_chaperones: 2 },
  { experience_id: expIds.art2, min_students: 1, max_students: 20, price_cents: 1800, free_chaperones: 1 },
];

const studentNames = [
  ['Emma', 'Johnson'], ['Liam', 'Williams'], ['Olivia', 'Brown'],
  ['Noah', 'Davis'], ['Ava', 'Garcia'], ['Ethan', 'Martinez'],
  ['Sophia', 'Anderson'], ['Mason', 'Thomas'], ['Isabella', 'Taylor'],
  ['James', 'Wilson'], ['Mia', 'Moore'], ['Lucas', 'Jackson'],
  ['Charlotte', 'White'], ['Alexander', 'Harris'], ['Amelia', 'Clark'],
];

const STUDENTS = studentNames.map(([first_name, last_name]) => ({
  id: randomUUID(),
  roster_id: rosterId,
  first_name,
  last_name,
  grade: '5th',
}));

async function seed() {
  console.log('Seeding demo data...\n');

  console.log('1. Inserting venues...');
  const { error: venueErr } = await supabase.from('venues').upsert(VENUES, { onConflict: 'id' });
  if (venueErr) { console.error('  ERROR:', venueErr.message); return; }
  console.log(`   ${VENUES.length} venues inserted`);

  console.log('2. Inserting experiences...');
  const { error: expErr } = await supabase.from('experiences').upsert(EXPERIENCES, { onConflict: 'id' });
  if (expErr) { console.error('  ERROR:', expErr.message); return; }
  console.log(`   ${EXPERIENCES.length} experiences inserted`);

  console.log('3. Inserting pricing tiers...');
  const expIdList = Object.values(expIds);
  await supabase.from('pricing_tiers').delete().in('experience_id', expIdList);
  const { error: ptErr } = await supabase.from('pricing_tiers').insert(PRICING_TIERS);
  if (ptErr) { console.error('  ERROR:', ptErr.message); return; }
  console.log(`   ${PRICING_TIERS.length} pricing tiers inserted`);

  console.log('4. Inserting school...');
  const { error: schoolErr } = await supabase.from('schools').upsert([{
    id: schoolId,
    name: 'Lincoln Elementary School',
    address: { street: '456 Maple Avenue', city: 'Denver', state: 'CO', zipCode: '80210', country: 'USA' },
  }], { onConflict: 'id' });
  if (schoolErr) { console.error('  ERROR:', schoolErr.message); return; }
  console.log('   1 school inserted');

  console.log('5. Inserting roster...');
  const { data: existingTeachers } = await supabase.from('teachers').select('id').limit(1);
  const demoTeacherId = existingTeachers?.[0]?.id;
  if (!demoTeacherId) { console.error('  ERROR: No teacher found to associate with roster'); return; }
  const { error: rosterErr } = await supabase.from('rosters').upsert([{
    id: rosterId,
    teacher_id: demoTeacherId,
    name: "Mrs. Chen's 5th Grade",
    grade_level: '5th',
  }], { onConflict: 'id' });
  if (rosterErr) { console.error('  ERROR:', rosterErr.message); return; }
  console.log('   1 roster inserted');

  console.log('6. Inserting students...');
  const { error: stuErr } = await supabase.from('students').upsert(STUDENTS, { onConflict: 'id' });
  if (stuErr) { console.error('  ERROR:', stuErr.message); return; }
  console.log(`   ${STUDENTS.length} students inserted`);

  console.log('\n--- Verification ---');
  const { data: vCheck } = await supabase.from('venues').select('id, name').in('id', Object.values(venueIds));
  console.log(`Venues: ${vCheck?.length} (${vCheck?.map(v => v.name).join(', ')})`);

  const { data: eCheck } = await supabase.from('experiences').select('id, title').in('id', expIdList);
  console.log(`Experiences: ${eCheck?.length}`);

  const { data: pCheck } = await supabase.from('pricing_tiers').select('id').in('experience_id', expIdList);
  console.log(`Pricing tiers: ${pCheck?.length}`);

  const { data: sCheck } = await supabase.from('students').select('id').eq('roster_id', rosterId);
  console.log(`Students: ${sCheck?.length}`);

  console.log('\nDone!');
}

seed().catch(console.error);
