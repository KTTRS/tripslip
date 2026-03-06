import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const VENUES = [
  // ==================== CHICAGO ====================
  {
    id: randomUUID(),
    name: 'The Field Museum',
    description: 'One of the largest natural history museums in the world, home to SUE the T. rex and exhibits spanning 4.6 billion years of life on Earth.',
    address: { street: '1400 S DuSable Lake Shore Dr', city: 'Chicago', state: 'IL', zipCode: '60605', country: 'USA', lat: 41.8663, lng: -87.6170 },
    contact_email: 'groupsales@fieldmuseum.org',
    contact_phone: '312-922-9410',
    website: 'https://www.fieldmuseum.org',
    capacity_min: 20, capacity_max: 300,
    rating: 4.7, review_count: 28400,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Evolving Planet Guided Tour', description: 'Walk through 4 billion years of life on Earth, from single-celled organisms to the age of mammals, guided by a museum educator.', duration: 90, capacity: 35, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Biology','Geology'], price_cents: 1800, objectives: ['Understand geological time periods','Learn about evolution and adaptation','Examine fossil evidence'] },
      { title: 'SUE the T. rex & Dinosaur Hall', description: 'Get up close with the world\'s most complete T. rex skeleton and explore the age of dinosaurs with hands-on fossil activities.', duration: 60, capacity: 30, grades: ['K','1st','2nd','3rd'], subjects: ['Science','Paleontology'], price_cents: 1500, objectives: ['Identify different dinosaur species','Understand paleontology as a science','Learn about the Cretaceous period'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Museum of Science and Industry',
    description: 'The largest science museum in the Western Hemisphere, featuring a captured WWII U-505 submarine, coal mine replica, and over 35,000 artifacts.',
    address: { street: '5700 S DuSable Lake Shore Dr', city: 'Chicago', state: 'IL', zipCode: '60637', country: 'USA', lat: 41.7906, lng: -87.5831 },
    contact_email: 'groupvisits@msichicago.org',
    contact_phone: '773-684-1414',
    website: 'https://www.msichicago.org',
    capacity_min: 20, capacity_max: 400,
    rating: 4.7, review_count: 22100,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'science_center',
    free: false,
    experiences: [
      { title: 'Science Storms Interactive Lab', description: 'Explore the physics of tornadoes, lightning, tsunamis, and avalanches through large-scale interactive exhibits.', duration: 90, capacity: 40, grades: ['4th','5th','6th'], subjects: ['Science','Physics'], price_cents: 2200, objectives: ['Understand extreme weather phenomena','Learn about energy transfer','Conduct physics experiments'] },
      { title: 'U-505 Submarine Tour', description: 'Board a real captured WWII German submarine and learn about the secret mission to capture it.', duration: 45, capacity: 25, grades: ['5th','6th','7th','8th'], subjects: ['History','Engineering'], price_cents: 2500, objectives: ['Learn about WWII naval warfare','Understand submarine engineering','Explore wartime intelligence operations'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Shedd Aquarium',
    description: 'A world-class aquarium on Chicago\'s lakefront with 32,000 aquatic animals representing over 1,500 species from around the globe.',
    address: { street: '1200 S DuSable Lake Shore Dr', city: 'Chicago', state: 'IL', zipCode: '60605', country: 'USA', lat: 41.8676, lng: -87.6140 },
    contact_email: 'fieldtrips@sheddaquarium.org',
    contact_phone: '312-939-2438',
    website: 'https://www.sheddaquarium.org',
    capacity_min: 15, capacity_max: 250,
    rating: 4.5, review_count: 31200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'aquarium',
    free: false,
    experiences: [
      { title: 'Underwater Beauty & Caribbean Reef', description: 'Explore the vibrant Caribbean Reef exhibit with a diver presentation and learn about coral reef ecosystems.', duration: 75, capacity: 35, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Marine Biology'], price_cents: 2000, objectives: ['Understand coral reef ecosystems','Identify marine species','Learn about ocean conservation'] },
      { title: 'Aquatic Show & Behind-the-Scenes', description: 'Watch the aquatic show featuring dolphins and belugas, then go behind the scenes to see how animals are cared for.', duration: 90, capacity: 30, grades: ['K','1st','2nd','3rd'], subjects: ['Science','Biology'], price_cents: 2400, objectives: ['Learn about marine mammal behavior','Understand animal husbandry','Explore marine veterinary science'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Art Institute of Chicago',
    description: 'One of the oldest and largest art museums in the United States, housing an encyclopedic collection spanning 5,000 years of art from around the world.',
    address: { street: '111 S Michigan Ave', city: 'Chicago', state: 'IL', zipCode: '60603', country: 'USA', lat: 41.8796, lng: -87.6237 },
    contact_email: 'groupvisits@artic.edu',
    contact_phone: '312-443-3600',
    website: 'https://www.artic.edu',
    capacity_min: 10, capacity_max: 200,
    rating: 4.8, review_count: 45600,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'art_gallery',
    free: false,
    experiences: [
      { title: 'Impressionism Gallery Tour', description: 'Explore the world-renowned Impressionist collection including works by Monet, Renoir, and Seurat with a museum educator.', duration: 75, capacity: 25, grades: ['3rd','4th','5th','6th'], subjects: ['Art','Art History'], price_cents: 0, objectives: ['Identify Impressionist techniques','Analyze use of light and color','Compare different artists\' styles'] },
      { title: 'Art-Making Workshop', description: 'Students create their own artwork inspired by masterpieces in the collection using various media.', duration: 90, capacity: 20, grades: ['2nd','3rd','4th','5th'], subjects: ['Art','Art History'], price_cents: 1200, objectives: ['Practice various art techniques','Interpret and respond to artwork','Express creativity through original art'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Lincoln Park Zoo',
    description: 'One of the oldest zoos in North America, offering free admission year-round with over 200 species across 35 acres in the heart of Chicago.',
    address: { street: '2001 N Clark St', city: 'Chicago', state: 'IL', zipCode: '60614', country: 'USA', lat: 41.9211, lng: -87.6340 },
    contact_email: 'education@lpzoo.org',
    contact_phone: '312-742-2000',
    website: 'https://www.lpzoo.org',
    capacity_min: 15, capacity_max: 200,
    rating: 4.6, review_count: 19800,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'zoo',
    free: true,
    experiences: [
      { title: 'Regenstein African Journey', description: 'Explore habitats of African wildlife including gorillas, pygmy hippos, and African wild dogs with an educator guide.', duration: 90, capacity: 30, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Biology','Geography'], price_cents: 0, objectives: ['Understand African ecosystems','Learn about endangered species','Explore animal adaptations'] },
      { title: 'Farm-in-the-Zoo Experience', description: 'Hands-on farm experience where students meet farm animals, learn about agriculture, and participate in seasonal farming activities.', duration: 60, capacity: 25, grades: ['K','1st','2nd'], subjects: ['Science','Agriculture'], price_cents: 0, objectives: ['Learn about farm animals and their care','Understand where food comes from','Explore sustainable agriculture'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Chicago Botanic Garden',
    description: '385-acre living museum featuring 27 gardens and four natural areas on nine islands, with extensive educational programs.',
    address: { street: '1000 Lake Cook Rd', city: 'Glencoe', state: 'IL', zipCode: '60022', country: 'USA', lat: 42.1480, lng: -87.7896 },
    contact_email: 'education@chicagobotanic.org',
    contact_phone: '847-835-5440',
    website: 'https://www.chicagobotanic.org',
    capacity_min: 15, capacity_max: 150,
    rating: 4.8, review_count: 14200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'botanical_garden',
    free: true,
    experiences: [
      { title: 'Plant Science Discovery Walk', description: 'Guided walk through themed gardens exploring plant biology, photosynthesis, and ecosystem interactions.', duration: 90, capacity: 30, grades: ['3rd','4th','5th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 0, objectives: ['Understand photosynthesis','Identify plant adaptations','Learn about ecosystems'] },
      { title: 'Butterflies & Blooms Exploration', description: 'Visit the butterfly exhibition to observe metamorphosis stages and learn about pollinator ecology.', duration: 60, capacity: 25, grades: ['1st','2nd','3rd'], subjects: ['Science','Biology'], price_cents: 800, objectives: ['Understand insect life cycles','Learn about pollination','Identify butterfly species'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Adler Planetarium',
    description: 'America\'s first planetarium, offering immersive sky shows and hands-on exhibits exploring the universe, space exploration, and astronomy.',
    address: { street: '1300 S DuSable Lake Shore Dr', city: 'Chicago', state: 'IL', zipCode: '60605', country: 'USA', lat: 41.8663, lng: -87.6068 },
    contact_email: 'fieldtrips@adlerplanetarium.org',
    contact_phone: '312-922-7827',
    website: 'https://www.adlerplanetarium.org',
    capacity_min: 15, capacity_max: 200,
    rating: 4.4, review_count: 12300,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'science_center',
    free: false,
    experiences: [
      { title: 'Grainger Sky Theater Show', description: 'Immersive planetarium show exploring the night sky, constellations, and the scale of the universe.', duration: 45, capacity: 50, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Astronomy'], price_cents: 1600, objectives: ['Identify major constellations','Understand scale of the solar system','Learn about space exploration history'] },
      { title: 'Mission Moon Workshop', description: 'Hands-on STEM workshop where students plan a moon mission, design spacecraft, and solve engineering challenges.', duration: 90, capacity: 25, grades: ['4th','5th','6th'], subjects: ['Science','Engineering','Math'], price_cents: 2000, objectives: ['Apply engineering design process','Learn about space travel challenges','Practice teamwork and problem-solving'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Chicago History Museum',
    description: 'Explore Chicago\'s rich history from the Great Fire to the present through immersive exhibits, artifacts, and interactive displays.',
    address: { street: '1601 N Clark St', city: 'Chicago', state: 'IL', zipCode: '60614', country: 'USA', lat: 41.9119, lng: -87.6317 },
    contact_email: 'tours@chicagohistory.org',
    contact_phone: '312-642-4600',
    website: 'https://www.chicagohistory.org',
    capacity_min: 10, capacity_max: 100,
    rating: 4.5, review_count: 4200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Great Chicago Fire Experience', description: 'Walk through an immersive recreation of the 1871 Great Chicago Fire and learn how the city rebuilt itself.', duration: 75, capacity: 30, grades: ['3rd','4th','5th','6th'], subjects: ['History','Social Studies'], price_cents: 1400, objectives: ['Understand causes of the Great Chicago Fire','Learn about urban planning and rebuilding','Analyze primary historical sources'] },
      { title: 'Chicago: Crossroads of America', description: 'Explore how Chicago became a transportation and cultural hub through hands-on exhibits about railroads, immigration, and industry.', duration: 90, capacity: 30, grades: ['4th','5th','6th'], subjects: ['History','Geography','Social Studies'], price_cents: 1400, objectives: ['Understand Chicago\'s role in American history','Learn about immigration patterns','Explore industrialization and transportation'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Peggy Notebaert Nature Museum',
    description: 'An interactive nature museum focused on ecology and conservation, featuring a Butterfly Haven with over 1,000 free-flying butterflies.',
    address: { street: '2430 N Cannon Dr', city: 'Chicago', state: 'IL', zipCode: '60614', country: 'USA', lat: 41.9263, lng: -87.6350 },
    contact_email: 'fieldtrips@naturemuseum.org',
    contact_phone: '773-755-5100',
    website: 'https://www.naturemuseum.org',
    capacity_min: 10, capacity_max: 100,
    rating: 4.5, review_count: 5100,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Butterfly Haven & Pollinator Workshop', description: 'Walk through the Butterfly Haven with 1,000+ free-flying butterflies, then participate in a hands-on pollinator ecology workshop.', duration: 75, capacity: 25, grades: ['1st','2nd','3rd','4th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 1200, objectives: ['Understand pollinator-plant relationships','Identify butterfly species','Learn about conservation'] },
      { title: 'Water Lab Investigation', description: 'Hands-on water science lab where students test water quality, study aquatic organisms, and learn about the Great Lakes ecosystem.', duration: 60, capacity: 20, grades: ['3rd','4th','5th'], subjects: ['Science','Environmental Studies'], price_cents: 1400, objectives: ['Learn water testing methods','Understand aquatic ecosystems','Explore water conservation'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'DuSable Black History Museum and Education Center',
    description: 'The first museum in the United States dedicated to the study and conservation of African American history, culture, and art.',
    address: { street: '740 E 56th Pl', city: 'Chicago', state: 'IL', zipCode: '60637', country: 'USA', lat: 41.7910, lng: -87.6088 },
    contact_email: 'education@dusablemuseum.org',
    contact_phone: '773-947-0600',
    website: 'https://www.dusablemuseum.org',
    capacity_min: 10, capacity_max: 80,
    rating: 4.4, review_count: 1800,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'African American History & Heritage Tour', description: 'Guided tour exploring the African American experience from enslavement to the Civil Rights Movement and beyond.', duration: 90, capacity: 30, grades: ['4th','5th','6th','7th'], subjects: ['History','Social Studies','Art'], price_cents: 1000, objectives: ['Understand African American history milestones','Analyze art as historical expression','Explore civil rights movements'] },
    ]
  },

  // ==================== NEW YORK CITY ====================
  {
    id: randomUUID(),
    name: 'American Museum of Natural History',
    description: 'One of the world\'s preeminent scientific and cultural institutions, with 45 permanent exhibition halls spanning human cultures, the natural world, and the universe.',
    address: { street: '200 Central Park West', city: 'New York', state: 'NY', zipCode: '10024', country: 'USA', lat: 40.7813, lng: -73.9740 },
    contact_email: 'groupvisits@amnh.org',
    contact_phone: '212-769-5100',
    website: 'https://www.amnh.org',
    capacity_min: 20, capacity_max: 400,
    rating: 4.7, review_count: 68200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Fossil Halls & Dinosaur Discovery', description: 'Explore the world-famous fossil halls housing the largest collection of real dinosaur fossils, including T. rex and Apatosaurus.', duration: 90, capacity: 35, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Paleontology','Biology'], price_cents: 2300, objectives: ['Understand the fossil record','Learn about dinosaur diversity','Explore extinction events'] },
      { title: 'Rose Center Space Show', description: 'Experience the Hayden Planetarium\'s immersive space show exploring the universe, from our solar system to distant galaxies.', duration: 60, capacity: 50, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Astronomy'], price_cents: 2700, objectives: ['Understand the scale of the universe','Learn about star formation','Explore our solar system'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'The Metropolitan Museum of Art',
    description: 'The largest art museum in the Americas, with a collection that spans 5,000 years of art from every corner of the world.',
    address: { street: '1000 5th Ave', city: 'New York', state: 'NY', zipCode: '10028', country: 'USA', lat: 40.7794, lng: -73.9632 },
    contact_email: 'groupvisits@metmuseum.org',
    contact_phone: '212-535-7710',
    website: 'https://www.metmuseum.org',
    capacity_min: 10, capacity_max: 300,
    rating: 4.8, review_count: 82400,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'art_gallery',
    free: false,
    experiences: [
      { title: 'Egyptian Art & Temple of Dendur', description: 'Explore the ancient Egyptian galleries and the iconic Temple of Dendur, learning about pharaohs, hieroglyphics, and daily life in ancient Egypt.', duration: 75, capacity: 25, grades: ['3rd','4th','5th','6th'], subjects: ['Art','History','Social Studies'], price_cents: 0, objectives: ['Understand ancient Egyptian art and culture','Decode hieroglyphic symbols','Learn about mummification and burial practices'] },
      { title: 'Arms & Armor Gallery Tour', description: 'Discover the art and engineering of medieval armor and weapons from Europe, Asia, and the Middle East.', duration: 60, capacity: 25, grades: ['4th','5th','6th','7th'], subjects: ['History','Art','Engineering'], price_cents: 0, objectives: ['Understand medieval warfare technology','Compare cultures through their art','Learn about metallurgy and craftsmanship'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Intrepid Sea, Air & Space Museum',
    description: 'A military and maritime history museum aboard the aircraft carrier USS Intrepid, featuring historic aircraft, the space shuttle Enterprise, and a submarine.',
    address: { street: 'Pier 86, W 46th St', city: 'New York', state: 'NY', zipCode: '10036', country: 'USA', lat: 40.7645, lng: -73.9997 },
    contact_email: 'groupsales@intrepidmuseum.org',
    contact_phone: '212-245-0072',
    website: 'https://www.intrepidmuseum.org',
    capacity_min: 15, capacity_max: 200,
    rating: 4.6, review_count: 24100,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Flight Deck & Aircraft Tour', description: 'Walk the historic flight deck of the USS Intrepid and explore military aircraft from WWII to the Space Age.', duration: 90, capacity: 35, grades: ['3rd','4th','5th','6th'], subjects: ['History','Science','Engineering'], price_cents: 2600, objectives: ['Learn about aviation history','Understand aircraft carrier operations','Explore WWII and Cold War history'] },
      { title: 'Space Shuttle Enterprise Pavilion', description: 'Visit the space shuttle Enterprise prototype and learn about NASA\'s Space Shuttle program and the future of space exploration.', duration: 60, capacity: 30, grades: ['4th','5th','6th','7th'], subjects: ['Science','Engineering','History'], price_cents: 2600, objectives: ['Understand Space Shuttle engineering','Learn about space exploration history','Explore future of spaceflight'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Bronx Zoo',
    description: 'The largest metropolitan zoo in the United States, home to over 6,000 animals of more than 700 species across 265 acres.',
    address: { street: '2300 Southern Blvd', city: 'Bronx', state: 'NY', zipCode: '10460', country: 'USA', lat: 40.8506, lng: -73.8769 },
    contact_email: 'groupsales@wcs.org',
    contact_phone: '718-220-5100',
    website: 'https://bronxzoo.com',
    capacity_min: 20, capacity_max: 300,
    rating: 4.5, review_count: 28900,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'zoo',
    free: false,
    experiences: [
      { title: 'Congo Gorilla Forest', description: 'Walk through an immersive African rainforest habitat and observe western lowland gorillas, okapis, and other Congo wildlife.', duration: 60, capacity: 35, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 2800, objectives: ['Understand rainforest ecosystems','Learn about primate behavior','Explore conservation challenges'] },
      { title: 'World of Reptiles & Bug Carousel', description: 'Visit the World of Reptiles to meet lizards, snakes, and crocodilians, then ride the Bug Carousel.', duration: 75, capacity: 30, grades: ['K','1st','2nd','3rd'], subjects: ['Science','Biology'], price_cents: 2800, objectives: ['Identify reptile characteristics','Learn about cold-blooded animals','Understand habitats and adaptations'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'New York Hall of Science',
    description: 'New York City\'s hands-on science and technology center, located in the iconic 1964 World\'s Fair building in Queens.',
    address: { street: '47-01 111th St', city: 'Queens', state: 'NY', zipCode: '11368', country: 'USA', lat: 40.7471, lng: -73.8517 },
    contact_email: 'fieldtrips@nysci.org',
    contact_phone: '718-699-0005',
    website: 'https://nysci.org',
    capacity_min: 15, capacity_max: 150,
    rating: 4.4, review_count: 6200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'science_center',
    free: false,
    experiences: [
      { title: 'Design Lab: Engineering Challenge', description: 'Hands-on engineering workshop where students build structures, test bridges, and solve design problems.', duration: 90, capacity: 30, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Engineering','Math'], price_cents: 1600, objectives: ['Apply engineering design process','Test structural integrity','Practice iterative problem-solving'] },
      { title: 'Rocket Park & Space Exploration', description: 'Explore the outdoor Rocket Park featuring authentic NASA rockets, then participate in a space science workshop.', duration: 75, capacity: 35, grades: ['4th','5th','6th'], subjects: ['Science','Astronomy','Engineering'], price_cents: 1600, objectives: ['Understand rocket propulsion','Learn about NASA missions','Explore space travel challenges'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Brooklyn Botanic Garden',
    description: 'A 52-acre urban garden featuring over 14,000 plants, the famous Japanese Garden, and the Steinhardt Conservatory.',
    address: { street: '990 Washington Ave', city: 'Brooklyn', state: 'NY', zipCode: '11225', country: 'USA', lat: 40.6694, lng: -73.9624 },
    contact_email: 'education@bbg.org',
    contact_phone: '718-623-7200',
    website: 'https://www.bbg.org',
    capacity_min: 10, capacity_max: 100,
    rating: 4.7, review_count: 10800,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'botanical_garden',
    free: false,
    experiences: [
      { title: 'Discovery Garden Workshop', description: 'Hands-on gardening and plant science workshop in the Discovery Garden, designed specifically for young learners.', duration: 75, capacity: 25, grades: ['1st','2nd','3rd','4th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 1000, objectives: ['Learn about plant parts and growth','Practice planting and garden care','Understand seasonal plant cycles'] },
      { title: 'Japanese Garden & Cultural Botany', description: 'Walk through the serene Japanese Hill-and-Pond Garden and learn about the cultural significance of plants across civilizations.', duration: 60, capacity: 20, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Social Studies','Art'], price_cents: 1200, objectives: ['Understand garden design principles','Learn about cultural uses of plants','Explore biodiversity'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'New York Aquarium',
    description: 'The oldest continually operating aquarium in the US, featuring sharks, sea otters, penguins, and the Ocean Wonders exhibit on Coney Island.',
    address: { street: '602 Surf Ave', city: 'Brooklyn', state: 'NY', zipCode: '11224', country: 'USA', lat: 40.5741, lng: -73.9754 },
    contact_email: 'groupsales@wcs.org',
    contact_phone: '718-265-3474',
    website: 'https://nyaquarium.com',
    capacity_min: 15, capacity_max: 200,
    rating: 4.3, review_count: 11500,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'aquarium',
    free: false,
    experiences: [
      { title: 'Ocean Wonders: Sharks! Tour', description: 'Explore the Ocean Wonders exhibit featuring sand tiger sharks, rays, and sea turtles in immersive ocean habitats.', duration: 75, capacity: 30, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Marine Biology'], price_cents: 2000, objectives: ['Understand shark biology','Learn about ocean food webs','Explore marine conservation'] },
      { title: 'Sea Otter & Penguin Encounter', description: 'Watch sea otter and penguin feedings, and learn about cold-water marine ecosystems from aquarium educators.', duration: 60, capacity: 25, grades: ['K','1st','2nd','3rd'], subjects: ['Science','Biology'], price_cents: 2000, objectives: ['Learn about marine mammal adaptations','Understand cold-water ecosystems','Explore animal behavior'] },
    ]
  },

  // ==================== WASHINGTON DC ====================
  {
    id: randomUUID(),
    name: 'Smithsonian National Museum of Natural History',
    description: 'The most-visited natural history museum in the world, home to the Hope Diamond and over 148 million specimens and artifacts.',
    address: { street: '10th St & Constitution Ave NW', city: 'Washington', state: 'DC', zipCode: '20560', country: 'USA', lat: 38.8913, lng: -77.0260 },
    contact_email: 'NMNHgroupvisits@si.edu',
    contact_phone: '202-633-1000',
    website: 'https://naturalhistory.si.edu',
    capacity_min: 15, capacity_max: 500,
    rating: 4.7, review_count: 52300,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'museum',
    free: true,
    experiences: [
      { title: 'Hope Diamond & Geology Hall', description: 'Explore the stunning geology and gems collection, see the legendary Hope Diamond, and learn about Earth\'s geological processes.', duration: 75, capacity: 35, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Geology'], price_cents: 0, objectives: ['Understand rock and mineral formation','Learn about geological processes','Explore the history of famous gems'] },
      { title: 'Human Origins Exhibit Tour', description: 'Walk through 6 million years of human evolution, examining fossil replicas and interactive displays.', duration: 90, capacity: 30, grades: ['5th','6th','7th','8th'], subjects: ['Science','Biology','Anthropology'], price_cents: 0, objectives: ['Understand human evolutionary history','Examine fossil evidence','Learn about early human cultures'] },
      { title: 'Ocean Hall Discovery', description: 'Explore the Sant Ocean Hall featuring a life-size model of a North Atlantic right whale and deep-sea exhibits.', duration: 60, capacity: 35, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Marine Biology','Environmental Studies'], price_cents: 0, objectives: ['Understand ocean ecosystems','Learn about marine biodiversity','Explore ocean conservation'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Smithsonian National Air and Space Museum',
    description: 'Home to the world\'s largest collection of historic aircraft and spacecraft, including the Wright Flyer and Apollo 11 command module.',
    address: { street: '600 Independence Ave SW', city: 'Washington', state: 'DC', zipCode: '20560', country: 'USA', lat: 38.8882, lng: -77.0199 },
    contact_email: 'NASMgroupvisits@si.edu',
    contact_phone: '202-633-2214',
    website: 'https://airandspace.si.edu',
    capacity_min: 20, capacity_max: 500,
    rating: 4.7, review_count: 47800,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'museum',
    free: true,
    experiences: [
      { title: 'Wright Brothers to Moon Landing', description: 'Trace the history of flight from the Wright Flyer to the Apollo 11 mission with hands-on flight simulators.', duration: 90, capacity: 35, grades: ['3rd','4th','5th','6th'], subjects: ['Science','History','Engineering'], price_cents: 0, objectives: ['Understand the principles of flight','Learn about aviation history milestones','Explore the Space Race'] },
      { title: 'Planetarium Show & Space Science', description: 'Experience an immersive planetarium show, then explore the space science galleries with a museum educator.', duration: 75, capacity: 40, grades: ['4th','5th','6th','7th'], subjects: ['Science','Astronomy'], price_cents: 0, objectives: ['Understand our place in the universe','Learn about planetary science','Explore future of space exploration'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Smithsonian National Museum of American History',
    description: 'Home to the Star-Spangled Banner, Abraham Lincoln\'s top hat, and millions of artifacts telling the story of America.',
    address: { street: '1300 Constitution Ave NW', city: 'Washington', state: 'DC', zipCode: '20560', country: 'USA', lat: 38.8912, lng: -77.0301 },
    contact_email: 'NMAHgroupvisits@si.edu',
    contact_phone: '202-633-1000',
    website: 'https://americanhistory.si.edu',
    capacity_min: 15, capacity_max: 400,
    rating: 4.6, review_count: 31200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'museum',
    free: true,
    experiences: [
      { title: 'Star-Spangled Banner & American Democracy', description: 'View the original Star-Spangled Banner flag and explore the evolution of American democracy through artifacts.', duration: 90, capacity: 35, grades: ['4th','5th','6th','7th'], subjects: ['History','Social Studies','Civics'], price_cents: 0, objectives: ['Understand key moments in American democracy','Analyze historical artifacts','Learn about the Constitution and Bill of Rights'] },
      { title: 'Innovation & Invention Gallery', description: 'Explore how American inventors changed the world, from Edison\'s light bulb to the first computers.', duration: 75, capacity: 30, grades: ['3rd','4th','5th','6th'], subjects: ['History','Science','Engineering'], price_cents: 0, objectives: ['Understand the innovation process','Learn about American inventors','Explore how technology shapes society'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'National Zoo (Smithsonian)',
    description: 'A free public zoo and conservation biology institute, home to 1,800 animals of 390 species across 163 acres of Rock Creek Park.',
    address: { street: '3001 Connecticut Ave NW', city: 'Washington', state: 'DC', zipCode: '20008', country: 'USA', lat: 38.9296, lng: -77.0499 },
    contact_email: 'NZPgroupvisits@si.edu',
    contact_phone: '202-633-4888',
    website: 'https://nationalzoo.si.edu',
    capacity_min: 15, capacity_max: 300,
    rating: 4.5, review_count: 22100,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'zoo',
    free: true,
    experiences: [
      { title: 'Great Cats & Asia Trail', description: 'Visit the Great Cats exhibit featuring lions and tigers, then walk the Asia Trail to see pandas, sloth bears, and red pandas.', duration: 90, capacity: 35, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Biology','Geography'], price_cents: 0, objectives: ['Understand big cat ecology','Learn about Asian wildlife','Explore conservation programs'] },
      { title: 'Amazonia Rainforest Experience', description: 'Walk through the immersive Amazonia exhibit, a living tropical rainforest with free-roaming animals.', duration: 60, capacity: 30, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 0, objectives: ['Understand tropical rainforest ecosystems','Learn about biodiversity','Explore deforestation and conservation'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'United States Holocaust Memorial Museum',
    description: 'America\'s official memorial to the Holocaust, providing a powerful learning experience about the consequences of hatred and the importance of human rights.',
    address: { street: '100 Raoul Wallenberg Pl SW', city: 'Washington', state: 'DC', zipCode: '20024', country: 'USA', lat: 38.8869, lng: -77.0326 },
    contact_email: 'groupvisits@ushmm.org',
    contact_phone: '202-488-0400',
    website: 'https://www.ushmm.org',
    capacity_min: 10, capacity_max: 150,
    rating: 4.8, review_count: 38700,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'museum',
    free: true,
    experiences: [
      { title: 'Remember the Children: Daniel\'s Story', description: 'Age-appropriate exhibit telling the story of a young boy during the Holocaust, designed for students grades 5 and up.', duration: 75, capacity: 30, grades: ['5th','6th','7th','8th'], subjects: ['History','Social Studies','Ethics'], price_cents: 0, objectives: ['Understand the Holocaust and its impact','Develop empathy and critical thinking','Learn about human rights and responsibility'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'National Gallery of Art',
    description: 'One of the world\'s greatest art collections, spanning from the Middle Ages to the present, housed in two buildings connected by an underground walkway.',
    address: { street: '6th & Constitution Ave NW', city: 'Washington', state: 'DC', zipCode: '20565', country: 'USA', lat: 38.8913, lng: -77.0199 },
    contact_email: 'schoolprograms@nga.gov',
    contact_phone: '202-737-4215',
    website: 'https://www.nga.gov',
    capacity_min: 10, capacity_max: 200,
    rating: 4.8, review_count: 26100,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'art_gallery',
    free: true,
    experiences: [
      { title: 'Art Detective Gallery Tour', description: 'Students become art detectives, using clues in paintings to understand composition, symbolism, and historical context.', duration: 75, capacity: 25, grades: ['3rd','4th','5th','6th'], subjects: ['Art','Art History'], price_cents: 0, objectives: ['Develop visual literacy skills','Understand art composition','Learn to interpret symbolic imagery'] },
      { title: 'Sculpture Garden & Modern Art', description: 'Explore the outdoor Sculpture Garden and modern art galleries, then participate in a sketch-based art activity.', duration: 90, capacity: 20, grades: ['4th','5th','6th','7th'], subjects: ['Art','Art History'], price_cents: 0, objectives: ['Understand modern and contemporary art','Compare 2D and 3D art forms','Practice observational drawing'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'United States Botanic Garden',
    description: 'The oldest continuously operating botanic garden in North America, right on the National Mall, featuring 65,000 plants.',
    address: { street: '100 Maryland Ave SW', city: 'Washington', state: 'DC', zipCode: '20001', country: 'USA', lat: 38.8882, lng: -77.0128 },
    contact_email: 'education@usbg.gov',
    contact_phone: '202-225-8333',
    website: 'https://www.usbg.gov',
    capacity_min: 10, capacity_max: 100,
    rating: 4.7, review_count: 8900,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'botanical_garden',
    free: true,
    experiences: [
      { title: 'Jungle & Desert Conservatory Walk', description: 'Walk through tropical, subtropical, and desert conservatory rooms to compare plant adaptations to different climates.', duration: 60, capacity: 25, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 0, objectives: ['Compare tropical and desert ecosystems','Understand plant adaptations','Learn about climate zones'] },
      { title: 'Children\'s Garden: Growing & Sustainability', description: 'Hands-on workshop in the Children\'s Garden exploring composting, planting, and sustainable gardening practices.', duration: 75, capacity: 20, grades: ['1st','2nd','3rd'], subjects: ['Science','Environmental Studies'], price_cents: 0, objectives: ['Learn about composting and soil health','Practice planting seeds','Understand sustainability'] },
    ]
  },

  // ==================== LOS ANGELES ====================
  {
    id: randomUUID(),
    name: 'Natural History Museum of Los Angeles County',
    description: 'The largest natural and historical museum in the western United States, with a collection of nearly 35 million specimens and artifacts.',
    address: { street: '900 W Exposition Blvd', city: 'Los Angeles', state: 'CA', zipCode: '90007', country: 'USA', lat: 33.9425, lng: -118.2889 },
    contact_email: 'groupsales@nhm.org',
    contact_phone: '213-763-3466',
    website: 'https://nhm.org',
    capacity_min: 15, capacity_max: 300,
    rating: 4.6, review_count: 18400,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Dinosaur Hall & Fossil Lab', description: 'Explore the Dinosaur Hall featuring over 300 real fossils, then visit the working fossil lab to watch paleontologists at work.', duration: 90, capacity: 35, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Paleontology','Biology'], price_cents: 1500, objectives: ['Understand the age of dinosaurs','Learn about fossil formation','Observe real paleontological work'] },
      { title: 'Nature Gardens & Urban Wildlife', description: 'Explore the outdoor Nature Gardens to discover native plants, insects, and urban wildlife in the heart of LA.', duration: 75, capacity: 30, grades: ['1st','2nd','3rd','4th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 1500, objectives: ['Identify native California plants','Understand urban ecosystems','Learn about pollinators'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'California Science Center',
    description: 'A free interactive science museum in Exposition Park, home to the space shuttle Endeavour and hands-on STEM exhibits.',
    address: { street: '700 Exposition Park Dr', city: 'Los Angeles', state: 'CA', zipCode: '90037', country: 'USA', lat: 33.9425, lng: -118.2864 },
    contact_email: 'fieldtrips@csc.org',
    contact_phone: '213-744-2019',
    website: 'https://californiasciencecenter.org',
    capacity_min: 20, capacity_max: 400,
    rating: 4.6, review_count: 21300,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'science_center',
    free: true,
    experiences: [
      { title: 'Space Shuttle Endeavour Experience', description: 'See the real space shuttle Endeavour up close and learn about its 25 missions and the science of spaceflight.', duration: 60, capacity: 40, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Engineering','History'], price_cents: 0, objectives: ['Understand space shuttle engineering','Learn about Endeavour\'s missions','Explore the future of space travel'] },
      { title: 'Ecosystems Interactive Gallery', description: 'Explore a living kelp forest, desert, polar region, and river habitats in this immersive multi-level exhibit.', duration: 90, capacity: 35, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 0, objectives: ['Compare different ecosystems','Understand food chains','Learn about climate and habitats'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Los Angeles County Museum of Art (LACMA)',
    description: 'The largest art museum in the western United States, with a collection spanning 6,000 years and representing cultures from around the world.',
    address: { street: '5905 Wilshire Blvd', city: 'Los Angeles', state: 'CA', zipCode: '90036', country: 'USA', lat: 33.9643, lng: -118.3588 },
    contact_email: 'groupvisits@lacma.org',
    contact_phone: '323-857-6010',
    website: 'https://www.lacma.org',
    capacity_min: 10, capacity_max: 200,
    rating: 4.5, review_count: 22700,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'art_gallery',
    free: false,
    experiences: [
      { title: 'World Art Discovery Tour', description: 'Guided tour exploring art from ancient civilizations to contemporary installations across LACMA\'s encyclopedic collection.', duration: 90, capacity: 25, grades: ['3rd','4th','5th','6th'], subjects: ['Art','Art History','Social Studies'], price_cents: 0, objectives: ['Compare art across cultures','Understand art as historical evidence','Develop visual analysis skills'] },
      { title: 'Urban Light & Contemporary Art', description: 'Explore LACMA\'s famous outdoor installations including Urban Light, then create contemporary art in a hands-on workshop.', duration: 75, capacity: 20, grades: ['4th','5th','6th','7th'], subjects: ['Art','Art History'], price_cents: 1000, objectives: ['Understand contemporary art movements','Explore public art and site-specific installations','Create original contemporary artwork'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Los Angeles Zoo & Botanical Gardens',
    description: 'Home to more than 1,400 animals from 270 species, plus a botanical collection of over 7,400 plants, set in 133 acres of Griffith Park.',
    address: { street: '5333 Zoo Dr', city: 'Los Angeles', state: 'CA', zipCode: '90027', country: 'USA', lat: 34.1482, lng: -118.2853 },
    contact_email: 'education@lazoo.org',
    contact_phone: '323-644-4200',
    website: 'https://www.lazoo.org',
    capacity_min: 15, capacity_max: 250,
    rating: 4.3, review_count: 15600,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'zoo',
    free: false,
    experiences: [
      { title: 'Rainforest of the Americas', description: 'Explore the lush Rainforest of the Americas exhibit and learn about tropical biodiversity and conservation.', duration: 75, capacity: 30, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 2200, objectives: ['Understand rainforest biodiversity','Learn about tropical animal adaptations','Explore conservation efforts'] },
      { title: 'LAIR: Amphibians & Reptiles', description: 'Visit the Living Amphibians, Invertebrates, and Reptiles exhibit to learn about these often-misunderstood creatures.', duration: 60, capacity: 25, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Biology'], price_cents: 2200, objectives: ['Identify reptile and amphibian characteristics','Learn about metamorphosis','Understand cold-blooded animal biology'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Griffith Observatory',
    description: 'An iconic LA landmark offering free public telescopes, planetarium shows, and stunning views of the Hollywood Sign and Los Angeles basin.',
    address: { street: '2800 E Observatory Rd', city: 'Los Angeles', state: 'CA', zipCode: '90027', country: 'USA', lat: 34.1184, lng: -118.3004 },
    contact_email: 'groupvisits@griffithobservatory.org',
    contact_phone: '213-473-0800',
    website: 'https://griffithobservatory.org',
    capacity_min: 10, capacity_max: 150,
    rating: 4.8, review_count: 42100,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'science_center',
    free: true,
    experiences: [
      { title: 'Samuel Oschin Planetarium Show', description: 'Immersive planetarium experience exploring the night sky, constellations, and the wonders of the universe.', duration: 45, capacity: 50, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Astronomy'], price_cents: 700, objectives: ['Identify major constellations','Understand Earth\'s position in the universe','Learn about light years and cosmic distances'] },
      { title: 'Tesla Coil & Observatory Exhibits', description: 'Watch the Tesla coil demonstration, explore hands-on exhibits about light, gravity, and the solar system.', duration: 60, capacity: 35, grades: ['4th','5th','6th','7th'], subjects: ['Science','Physics','Astronomy'], price_cents: 0, objectives: ['Understand electricity and magnetism','Learn about the solar system','Explore light and optics'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Aquarium of the Pacific',
    description: 'The largest aquarium in Southern California, featuring over 12,000 animals representing 500+ species from the Pacific Ocean.',
    address: { street: '100 Aquarium Way', city: 'Long Beach', state: 'CA', zipCode: '90802', country: 'USA', lat: 33.7627, lng: -118.1965 },
    contact_email: 'groupsales@lbaop.org',
    contact_phone: '562-590-3100',
    website: 'https://www.aquariumofpacific.org',
    capacity_min: 15, capacity_max: 250,
    rating: 4.5, review_count: 17800,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'aquarium',
    free: false,
    experiences: [
      { title: 'Pacific Visions Theater & Coral Reef', description: 'Experience the immersive Pacific Visions theater, then explore the Tropical Pacific gallery and living coral reef.', duration: 90, capacity: 35, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Marine Biology','Environmental Studies'], price_cents: 2100, objectives: ['Understand coral reef ecosystems','Learn about ocean conservation','Explore marine biodiversity'] },
      { title: 'Shark Lagoon & Touch Pools', description: 'Get hands-on at the touch pools with sharks, rays, and tide pool creatures, then learn about shark biology.', duration: 60, capacity: 30, grades: ['1st','2nd','3rd','4th'], subjects: ['Science','Marine Biology'], price_cents: 2100, objectives: ['Learn about shark and ray biology','Understand tide pool ecosystems','Practice gentle animal interaction'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'The Huntington Library, Art Museum, and Botanical Gardens',
    description: 'A world-class cultural, research, and educational institution featuring 130 acres of botanical gardens, rare book collections, and fine art.',
    address: { street: '1151 Oxford Rd', city: 'San Marino', state: 'CA', zipCode: '91108', country: 'USA', lat: 34.1292, lng: -118.1146 },
    contact_email: 'education@huntington.org',
    contact_phone: '626-405-2100',
    website: 'https://www.huntington.org',
    capacity_min: 10, capacity_max: 150,
    rating: 4.8, review_count: 14200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'botanical_garden',
    free: false,
    experiences: [
      { title: 'Desert Garden & Plant Adaptations', description: 'Walk through one of the world\'s largest desert plant collections and learn how plants adapt to extreme environments.', duration: 75, capacity: 25, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Biology','Environmental Studies'], price_cents: 1300, objectives: ['Understand plant adaptations to drought','Compare desert and tropical plants','Learn about xeriscaping'] },
      { title: 'Chinese Garden & Cultural Exploration', description: 'Explore the exquisite Chinese Garden, one of the largest outside China, and learn about Chinese art, architecture, and botany.', duration: 90, capacity: 25, grades: ['4th','5th','6th','7th'], subjects: ['Art','History','Social Studies','Science'], price_cents: 1300, objectives: ['Understand Chinese garden design philosophy','Learn about cultural exchange','Explore Asian art and calligraphy'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'La Brea Tar Pits and Museum',
    description: 'An active paleontological research site where Ice Age fossils have been excavated for over a century, featuring saber-toothed cats and mammoths.',
    address: { street: '5801 Wilshire Blvd', city: 'Los Angeles', state: 'CA', zipCode: '90036', country: 'USA', lat: 33.9641, lng: -118.3553 },
    contact_email: 'groupvisits@tarpits.org',
    contact_phone: '213-763-3499',
    website: 'https://tarpits.org',
    capacity_min: 15, capacity_max: 200,
    rating: 4.4, review_count: 13800,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Fossil Lab & Excavation Site Tour', description: 'Watch scientists clean and identify real Ice Age fossils in the working Fossil Lab, then visit active excavation pits.', duration: 75, capacity: 30, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Paleontology','Geology'], price_cents: 1500, objectives: ['Understand Ice Age Los Angeles','Learn about tar pit fossil preservation','Observe real paleontological research'] },
      { title: 'Saber-Toothed Cat & Mammoth Exhibit', description: 'Explore life-size Ice Age mammal reconstructions and learn about the megafauna that once roamed LA.', duration: 60, capacity: 35, grades: ['2nd','3rd','4th','5th'], subjects: ['Science','Biology','History'], price_cents: 1500, objectives: ['Identify Ice Age mammals','Understand extinction causes','Learn about the Pleistocene epoch'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'The Getty Center',
    description: 'A hilltop campus showcasing European paintings, drawings, sculpture, and photography from the Middle Ages to the present, with stunning architecture and gardens.',
    address: { street: '1200 Getty Center Dr', city: 'Los Angeles', state: 'CA', zipCode: '90049', country: 'USA', lat: 34.0780, lng: -118.4741 },
    contact_email: 'groupvisits@getty.edu',
    contact_phone: '310-440-7300',
    website: 'https://www.getty.edu',
    capacity_min: 10, capacity_max: 200,
    rating: 4.8, review_count: 35600,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'art_gallery',
    free: true,
    experiences: [
      { title: 'Architecture & Garden Design Tour', description: 'Explore Richard Meier\'s stunning architecture and Robert Irwin\'s Central Garden, learning about design principles.', duration: 75, capacity: 25, grades: ['4th','5th','6th','7th'], subjects: ['Art','Architecture','Science'], price_cents: 0, objectives: ['Understand architectural design principles','Learn about garden design as art','Explore the relationship between art and nature'] },
      { title: 'European Art Through the Ages', description: 'Guided tour of European paintings from the Middle Ages through the 1900s, with hands-on sketching activities.', duration: 90, capacity: 20, grades: ['3rd','4th','5th','6th'], subjects: ['Art','Art History','History'], price_cents: 0, objectives: ['Compare art across historical periods','Understand artistic techniques','Practice observational drawing'] },
    ]
  },

  // ==================== ADDITIONAL (cross-metro for variety) ====================
  {
    id: randomUUID(),
    name: 'Smithsonian National Museum of African American History and Culture',
    description: 'The only national museum devoted exclusively to the documentation of African American life, history, and culture, opened in 2016.',
    address: { street: '1400 Constitution Ave NW', city: 'Washington', state: 'DC', zipCode: '20560', country: 'USA', lat: 38.8910, lng: -77.0328 },
    contact_email: 'NMAAHCgroupvisits@si.edu',
    contact_phone: '202-633-1000',
    website: 'https://nmaahc.si.edu',
    capacity_min: 15, capacity_max: 300,
    rating: 4.8, review_count: 28900,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'museum',
    free: true,
    experiences: [
      { title: 'Slavery & Freedom Exhibit', description: 'Powerful exhibit tracing the history of slavery in America and the long road to freedom, with age-appropriate content for older students.', duration: 90, capacity: 30, grades: ['6th','7th','8th'], subjects: ['History','Social Studies','Civics'], price_cents: 0, objectives: ['Understand the history and impact of slavery','Learn about resistance and abolition movements','Connect historical events to modern civil rights'] },
      { title: 'Culture Galleries: Music, Sports & Visual Arts', description: 'Explore how African Americans shaped American culture through music, sports, visual arts, and media.', duration: 75, capacity: 30, grades: ['4th','5th','6th','7th'], subjects: ['History','Art','Music','Social Studies'], price_cents: 0, objectives: ['Understand cultural contributions of African Americans','Explore the evolution of American music','Learn about art as social commentary'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Museum of Contemporary Art Chicago (MCA)',
    description: 'One of the largest contemporary art museums in the world, featuring cutting-edge art from 1945 to the present.',
    address: { street: '220 E Chicago Ave', city: 'Chicago', state: 'IL', zipCode: '60611', country: 'USA', lat: 41.8972, lng: -87.6213 },
    contact_email: 'education@mcachicago.org',
    contact_phone: '312-280-2660',
    website: 'https://mcachicago.org',
    capacity_min: 10, capacity_max: 100,
    rating: 4.3, review_count: 4800,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'Chicago',
    type: 'art_gallery',
    free: false,
    experiences: [
      { title: 'Contemporary Art Lab', description: 'Explore current exhibitions and create art inspired by contemporary artists in a hands-on studio workshop.', duration: 90, capacity: 20, grades: ['4th','5th','6th','7th'], subjects: ['Art','Art History'], price_cents: 1200, objectives: ['Understand contemporary art concepts','Experiment with mixed media','Develop personal artistic expression'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Children\'s Museum of Manhattan',
    description: 'Five floors of interactive, educational exhibits designed for children and families, focused on early learning and creativity.',
    address: { street: '212 W 83rd St', city: 'New York', state: 'NY', zipCode: '10024', country: 'USA', lat: 40.7854, lng: -73.9727 },
    contact_email: 'fieldtrips@cmom.org',
    contact_phone: '212-721-1223',
    website: 'https://cmom.org',
    capacity_min: 10, capacity_max: 80,
    rating: 4.3, review_count: 5400,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'EatSleepPlay: Health & Wellness', description: 'Interactive exhibit teaching kids about nutrition, exercise, and healthy habits through play.', duration: 60, capacity: 20, grades: ['K','1st','2nd'], subjects: ['Health','Science'], price_cents: 1400, objectives: ['Learn about healthy eating habits','Understand the importance of exercise','Practice making healthy choices'] },
      { title: 'Adventures with Dora & Diego', description: 'Explore language, music, and nature through Nickelodeon\'s beloved characters in this bilingual exhibit.', duration: 45, capacity: 20, grades: ['Pre-K','K','1st'], subjects: ['Language Arts','Science','Music'], price_cents: 1400, objectives: ['Practice English and Spanish vocabulary','Explore nature through play','Develop social skills through cooperative play'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'International Spy Museum',
    description: 'The only public museum in the US dedicated to espionage, featuring the largest collection of spy artifacts on public display.',
    address: { street: '700 L\'Enfant Plaza SW', city: 'Washington', state: 'DC', zipCode: '20024', country: 'USA', lat: 38.8840, lng: -77.0231 },
    contact_email: 'groupsales@spymuseum.org',
    contact_phone: '202-393-7798',
    website: 'https://www.spymuseum.org',
    capacity_min: 10, capacity_max: 150,
    rating: 4.5, review_count: 16700,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'DC',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Undercover Mission Experience', description: 'Assume a cover identity and complete an interactive spy mission through the museum, using code-breaking and surveillance skills.', duration: 90, capacity: 30, grades: ['5th','6th','7th','8th'], subjects: ['History','Critical Thinking','Technology'], price_cents: 2500, objectives: ['Understand the history of espionage','Develop critical thinking and observation skills','Learn about cryptography and code-breaking'] },
      { title: 'Spy Science & Gadgets', description: 'Explore real spy gadgets and the science behind surveillance technology, from hidden cameras to lie detectors.', duration: 60, capacity: 25, grades: ['4th','5th','6th','7th'], subjects: ['Science','Technology','History'], price_cents: 2500, objectives: ['Understand surveillance technology','Learn about forensic science','Explore ethics of intelligence gathering'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'USS Midway Museum',
    description: 'A maritime museum aboard the aircraft carrier USS Midway, the longest-serving Navy aircraft carrier of the 20th century, docked in San Diego.',
    address: { street: '910 N Harbor Dr', city: 'San Diego', state: 'CA', zipCode: '92101', country: 'USA', lat: 32.7137, lng: -117.1750 },
    contact_email: 'groups@midway.org',
    contact_phone: '619-544-9600',
    website: 'https://www.midway.org',
    capacity_min: 15, capacity_max: 250,
    rating: 4.8, review_count: 32100,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Aircraft Carrier Tour & Flight Simulators', description: 'Self-guided audio tour of the ship from engine room to bridge, plus flight simulator experience.', duration: 120, capacity: 35, grades: ['4th','5th','6th','7th','8th'], subjects: ['History','Engineering','Science'], price_cents: 2600, objectives: ['Understand naval aviation history','Learn about aircraft carrier operations','Explore STEM in military engineering'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'San Diego Zoo',
    description: 'A world-renowned zoo housing over 12,000 animals of more than 650 species and subspecies across 100 acres in Balboa Park.',
    address: { street: '2920 Zoo Dr', city: 'San Diego', state: 'CA', zipCode: '92101', country: 'USA', lat: 32.7353, lng: -117.1490 },
    contact_email: 'groupsales@sdzwa.org',
    contact_phone: '619-231-1515',
    website: 'https://zoo.sandiegozoo.org',
    capacity_min: 20, capacity_max: 300,
    rating: 4.7, review_count: 55400,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'zoo',
    free: false,
    experiences: [
      { title: 'Africa Rocks & Outback Tour', description: 'Guided tour through Africa Rocks habitat featuring penguins, leopards, and baboons, plus the Australian Outback exhibit.', duration: 120, capacity: 35, grades: ['2nd','3rd','4th','5th','6th'], subjects: ['Science','Biology','Geography'], price_cents: 3000, objectives: ['Understand African and Australian ecosystems','Learn about animal adaptations','Explore wildlife conservation'] },
      { title: 'Behind-the-Scenes Conservation Tour', description: 'Go behind the scenes to learn about the zoo\'s conservation breeding programs and veterinary care.', duration: 90, capacity: 20, grades: ['5th','6th','7th','8th'], subjects: ['Science','Biology','Veterinary Science'], price_cents: 3500, objectives: ['Understand conservation breeding','Learn about wildlife veterinary medicine','Explore careers in zoology'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'The 9/11 Memorial & Museum',
    description: 'A tribute to the nearly 3,000 people killed in the terror attacks of September 11, 2001, with exhibits of artifacts and personal stories.',
    address: { street: '180 Greenwich St', city: 'New York', state: 'NY', zipCode: '10007', country: 'USA', lat: 40.7115, lng: -74.0134 },
    contact_email: 'schoolprograms@911memorial.org',
    contact_phone: '212-312-8800',
    website: 'https://www.911memorial.org',
    capacity_min: 10, capacity_max: 150,
    rating: 4.8, review_count: 49200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'NYC',
    type: 'museum',
    free: false,
    experiences: [
      { title: 'Memorial & Museum Educational Tour', description: 'Age-appropriate guided tour of the memorial and museum, exploring themes of remembrance, resilience, and community.', duration: 90, capacity: 30, grades: ['6th','7th','8th'], subjects: ['History','Social Studies','Civics'], price_cents: 1500, objectives: ['Understand the events of September 11, 2001','Learn about community resilience','Explore themes of remembrance and hope'] },
    ]
  },
  {
    id: randomUUID(),
    name: 'Monterey Bay Aquarium',
    description: 'A world-class aquarium on Monterey Bay, featuring over 35,000 creatures and 550 species, with a focus on ocean conservation.',
    address: { street: '886 Cannery Row', city: 'Monterey', state: 'CA', zipCode: '93940', country: 'USA', lat: 36.6183, lng: -121.9018 },
    contact_email: 'groupsales@mbayaq.org',
    contact_phone: '831-648-4800',
    website: 'https://www.montereybayaquarium.org',
    capacity_min: 15, capacity_max: 250,
    rating: 4.8, review_count: 31200,
    verified: true, claimed: false,
    source: 'platform',
    metro: 'LA',
    type: 'aquarium',
    free: false,
    experiences: [
      { title: 'Open Sea & Kelp Forest Exhibit', description: 'Watch sea otters, jellyfish, and hammerhead sharks in the Open Sea gallery, then observe the two-story kelp forest exhibit.', duration: 90, capacity: 35, grades: ['3rd','4th','5th','6th'], subjects: ['Science','Marine Biology','Environmental Studies'], price_cents: 2500, objectives: ['Understand kelp forest ecosystems','Learn about open ocean habitats','Explore marine conservation'] },
      { title: 'Splash Zone & Tide Pool Touch Tanks', description: 'Get hands-on with tide pool creatures like sea stars, hermit crabs, and sea cucumbers at the interactive Splash Zone.', duration: 60, capacity: 25, grades: ['K','1st','2nd','3rd'], subjects: ['Science','Marine Biology'], price_cents: 2500, objectives: ['Identify intertidal zone organisms','Learn about ocean tides','Practice scientific observation'] },
    ]
  },
];

const TYPE_TO_CATEGORY = {
  'museum': 'Museums',
  'science_center': 'Science Centers',
  'aquarium': 'Aquariums',
  'zoo': 'Zoos',
  'botanical_garden': 'Botanical Gardens',
  'art_gallery': 'Art Museums',
  'tourist_attraction': 'Historical Sites',
};

async function populateVenues() {
  console.log('=== TripSlip Real Venue Population Script ===\n');
  console.log(`Total venues to insert: ${VENUES.length}\n`);

  const categoryMap = {};
  const { data: categories, error: catErr } = await supabase
    .from('venue_categories')
    .select('id, name');
  if (catErr) {
    console.error('Failed to fetch categories:', catErr.message);
  } else if (categories) {
    for (const cat of categories) {
      categoryMap[cat.name] = cat.id;
    }
    console.log(`Loaded ${categories.length} venue categories`);
  }

  let venueCount = 0;
  let expCount = 0;
  let pricingCount = 0;
  let catAssignCount = 0;

  for (const venue of VENUES) {
    const { experiences, metro, type, free, ...venueData } = venue;

    const lat = venueData.address?.lat;
    const lng = venueData.address?.lng;

    const venueRow = {
      ...venueData,
      operating_hours: [
        { day: 'Monday', open: '09:00', close: '17:00' },
        { day: 'Tuesday', open: '09:00', close: '17:00' },
        { day: 'Wednesday', open: '09:00', close: '17:00' },
        { day: 'Thursday', open: '09:00', close: '17:00' },
        { day: 'Friday', open: '09:00', close: '17:00' },
        { day: 'Saturday', open: '10:00', close: '17:00' },
        { day: 'Sunday', open: '10:00', close: '17:00' },
      ],
      supported_age_groups: ['elementary', 'middle'],
      profile_completeness: 85,
      accessibility_features: { wheelchair_accessible: true, elevator: true, restrooms: true },
    };

    const { error: vErr } = await supabase.from('venues').upsert([venueRow], { onConflict: 'id' });
    if (vErr) {
      console.error(`  ERROR inserting venue "${venue.name}":`, vErr.message);
      continue;
    }
    venueCount++;

    if (lat && lng) {
      try {
        await supabase
          .from('venues')
          .update({ location: `SRID=4326;POINT(${lng} ${lat})` })
          .eq('id', venue.id);
      } catch (e) {}
    }

    const categoryName = TYPE_TO_CATEGORY[type];
    if (categoryName && categoryMap[categoryName]) {
      const { error: caErr } = await supabase
        .from('venue_category_assignments')
        .upsert([{ venue_id: venue.id, category_id: categoryMap[categoryName] }], {
          onConflict: 'venue_id,category_id',
        });
      if (!caErr) catAssignCount++;
    }

    for (const exp of experiences) {
      const expId = randomUUID();
      const expRow = {
        id: expId,
        venue_id: venue.id,
        title: exp.title,
        description: exp.description,
        duration_minutes: exp.duration,
        capacity: exp.capacity,
        min_students: Math.max(8, Math.floor(exp.capacity * 0.3)),
        max_students: exp.capacity,
        grade_levels: exp.grades,
        subjects: exp.subjects,
        published: true,
        active: true,
        educational_objectives: exp.objectives,
      };

      const { error: eErr } = await supabase.from('experiences').upsert([expRow], { onConflict: 'id' });
      if (eErr) {
        console.error(`  ERROR inserting experience "${exp.title}":`, eErr.message);
        continue;
      }
      expCount++;

      const tiers = [];
      if (exp.price_cents === 0) {
        tiers.push({
          experience_id: expId,
          min_students: 1,
          max_students: exp.capacity,
          price_cents: 0,
          free_chaperones: 3,
        });
      } else {
        const mid = Math.ceil(exp.capacity * 0.6);
        tiers.push({
          experience_id: expId,
          min_students: 1,
          max_students: mid,
          price_cents: exp.price_cents,
          free_chaperones: 2,
        });
        tiers.push({
          experience_id: expId,
          min_students: mid + 1,
          max_students: exp.capacity,
          price_cents: Math.round(exp.price_cents * 0.85),
          free_chaperones: 3,
        });
        pricingCount++;
      }

      const { error: ptErr } = await supabase.from('pricing_tiers').insert(tiers);
      if (ptErr) {
        console.error(`  ERROR inserting pricing for "${exp.title}":`, ptErr.message);
      } else {
        pricingCount += tiers.length > 1 ? 1 : 0;
      }
    }

    console.log(`  ✓ ${venue.name} (${metro}) — ${experiences.length} experiences`);
  }

  console.log('\n=== Summary ===');
  console.log(`Venues inserted: ${venueCount}`);
  console.log(`Experiences inserted: ${expCount}`);
  console.log(`Category assignments: ${catAssignCount}`);

  console.log('\n=== Verification ===');
  const { data: vCount } = await supabase.from('venues').select('id', { count: 'exact', head: true }).eq('source', 'platform');
  console.log(`Total platform venues in DB: ${vCount?.length ?? 'unknown'}`);

  const { data: eCount } = await supabase.from('experiences').select('id', { count: 'exact', head: true }).eq('published', true);
  console.log(`Total published experiences: ${eCount?.length ?? 'unknown'}`);

  const { count: venueTotal } = await supabase.from('venues').select('*', { count: 'exact', head: true });
  console.log(`Total venues in DB: ${venueTotal}`);

  const { count: expTotal } = await supabase.from('experiences').select('*', { count: 'exact', head: true });
  console.log(`Total experiences in DB: ${expTotal}`);

  const { data: metros } = await supabase
    .from('venues')
    .select('address')
    .eq('source', 'platform');

  if (metros) {
    const cityCounts = {};
    for (const v of metros) {
      const city = v.address?.city || v.address?.state || 'Unknown';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
    console.log('\nVenues by city:');
    for (const [city, count] of Object.entries(cityCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${city}: ${count}`);
    }
  }

  console.log('\nDone! Venue search should now return 40+ real places.');
}

populateVenues().catch(console.error);
