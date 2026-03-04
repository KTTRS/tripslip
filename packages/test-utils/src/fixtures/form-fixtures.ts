/**
 * Form fixtures for testing form components and validation
 * Provides realistic form data for all TripSlip forms
 */

// Permission slip form data
export const permissionSlipFormFixtures = {
  valid: {
    studentName: 'Emma Johnson',
    studentGrade: '5',
    studentDob: '2014-03-15',
    parentName: 'Jennifer Johnson',
    parentEmail: 'jennifer.johnson@example.com',
    parentPhone: '+1-555-0789',
    emergencyContactName: 'Michael Johnson',
    emergencyContactPhone: '+1-555-0790',
    emergencyContactRelationship: 'Father',
    medicalConditions: 'Mild peanut allergy',
    medications: 'EpiPen (carried by student)',
    dietaryRestrictions: 'No peanuts or tree nuts',
    photoPermission: true,
    pickupPermission: true,
    specialInstructions: 'Please ensure student has EpiPen at all times',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  },
  
  minimal: {
    studentName: 'John Doe',
    studentGrade: '3',
    studentDob: '2016-09-12',
    parentName: 'Jane Doe',
    parentEmail: 'jane.doe@example.com',
    parentPhone: '+1-555-0123',
    emergencyContactName: 'Bob Doe',
    emergencyContactPhone: '+1-555-0124',
    emergencyContactRelationship: 'Uncle',
    medicalConditions: '',
    medications: '',
    dietaryRestrictions: '',
    photoPermission: true,
    pickupPermission: false,
    specialInstructions: '',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  },
  
  invalid: {
    studentName: '', // Missing required field
    studentGrade: '5',
    studentDob: '2014-03-15',
    parentName: 'Jennifer Johnson',
    parentEmail: 'invalid-email', // Invalid email format
    parentPhone: '555-0789', // Missing country code
    emergencyContactName: 'Michael Johnson',
    emergencyContactPhone: '+1-555-0790',
    emergencyContactRelationship: 'Father',
    medicalConditions: 'Mild peanut allergy',
    medications: 'EpiPen (carried by student)',
    dietaryRestrictions: 'No peanuts or tree nuts',
    photoPermission: true,
    pickupPermission: true,
    specialInstructions: 'Please ensure student has EpiPen at all times',
    signature: '', // Missing signature
  },
};

// Trip creation form data
export const tripFormFixtures = {
  valid: {
    title: 'Science Museum Field Trip',
    description: 'Educational visit to explore dinosaur exhibits and participate in space workshop.',
    venueId: 'venue-123',
    experienceId: 'exp-123',
    tripDate: '2024-06-15',
    departureTime: '08:30',
    returnTime: '15:00',
    maxParticipants: 25,
    gradeLevel: '5',
    subjectArea: 'Science',
    learningObjectives: [
      'Understand dinosaur evolution',
      'Learn about space exploration',
      'Practice scientific observation',
    ],
    specialRequirements: 'Students must wear closed-toe shoes',
    transportationMethod: 'School bus',
    lunchArrangement: 'Packed lunch from school',
    emergencyContact: 'Jane Teacher - +1-555-0123',
  },
  
  minimal: {
    title: 'Zoo Visit',
    description: 'Educational zoo visit',
    venueId: 'venue-456',
    experienceId: 'exp-789',
    tripDate: '2024-07-20',
    departureTime: '09:00',
    returnTime: '14:30',
    maxParticipants: 30,
    gradeLevel: '7',
    subjectArea: 'Biology',
    learningObjectives: ['Observe animal behaviors'],
    specialRequirements: '',
    transportationMethod: 'Charter bus',
    lunchArrangement: 'Cafeteria lunch at venue',
    emergencyContact: 'Jane Teacher - +1-555-0123',
  },
  
  invalid: {
    title: '', // Missing required field
    description: 'Educational visit',
    venueId: '', // Missing required field
    experienceId: 'exp-123',
    tripDate: '2024-02-30', // Invalid date
    departureTime: '25:00', // Invalid time
    returnTime: '15:00',
    maxParticipants: -5, // Invalid number
    gradeLevel: '5',
    subjectArea: 'Science',
    learningObjectives: [],
    specialRequirements: '',
    transportationMethod: 'School bus',
    lunchArrangement: 'Packed lunch from school',
    emergencyContact: '', // Missing required field
  },
};

// Experience creation form data
export const experienceFormFixtures = {
  valid: {
    title: 'Dinosaur Discovery Tour',
    description: 'Interactive guided tour through our paleontology exhibits featuring life-size dinosaur models and fossil displays.',
    durationMinutes: 90,
    maxParticipants: 30,
    priceCents: 1500,
    ageRangeMin: 8,
    ageRangeMax: 18,
    learningObjectives: [
      'Understand dinosaur evolution and extinction',
      'Learn about fossil formation and discovery',
      'Explore paleontology as a career',
    ],
    curriculumStandards: ['NGSS 5-LS2-1', 'NGSS MS-LS4-1'],
    materialsProvided: ['Activity worksheets', 'Fossil replicas for handling'],
    requirements: ['Closed-toe shoes required', 'Adult supervision needed'],
  },
  
  minimal: {
    title: 'Basic Tour',
    description: 'Simple guided tour',
    durationMinutes: 60,
    maxParticipants: 20,
    priceCents: 1000,
    ageRangeMin: 5,
    ageRangeMax: 18,
    learningObjectives: ['Learn about exhibits'],
    curriculumStandards: [],
    materialsProvided: [],
    requirements: [],
  },
  
  invalid: {
    title: '', // Missing required field
    description: 'Interactive tour',
    durationMinutes: -30, // Invalid duration
    maxParticipants: 0, // Invalid participant count
    priceCents: -100, // Invalid price
    ageRangeMin: 25, // Invalid age range (min > max)
    ageRangeMax: 18,
    learningObjectives: [],
    curriculumStandards: [],
    materialsProvided: [],
    requirements: [],
  },
};

// Venue profile form data
export const venueFormFixtures = {
  valid: {
    name: 'California Science Museum',
    description: 'Interactive science museum with hands-on exhibits covering physics, chemistry, biology, and space exploration.',
    address: '700 Exposition Park Dr, Los Angeles, CA 90037',
    phone: '+1-213-555-0400',
    email: 'education@californiascience.org',
    website: 'https://californiascience.org',
    category: 'museum',
    subcategory: 'science',
    capacity: 200,
    parkingAvailable: true,
    wheelchairAccessible: true,
    foodServiceAvailable: true,
    giftShopAvailable: true,
    indoorFacility: true,
    outdoorFacility: false,
    ageRangeMin: 5,
    ageRangeMax: 18,
    operatingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { open: '10:00', close: '18:00' },
    },
  },
  
  minimal: {
    name: 'Local Museum',
    description: 'Small local museum',
    address: '123 Main St, Anytown, CA 90210',
    phone: '+1-555-0100',
    email: 'info@localmuseum.org',
    website: 'https://localmuseum.org',
    category: 'museum',
    subcategory: 'history',
    capacity: 50,
    parkingAvailable: true,
    wheelchairAccessible: true,
    foodServiceAvailable: false,
    giftShopAvailable: false,
    indoorFacility: true,
    outdoorFacility: false,
    ageRangeMin: 6,
    ageRangeMax: 18,
    operatingHours: {
      monday: { open: '10:00', close: '16:00' },
      tuesday: { open: '10:00', close: '16:00' },
      wednesday: { open: '10:00', close: '16:00' },
      thursday: { open: '10:00', close: '16:00' },
      friday: { open: '10:00', close: '16:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '12:00', close: '16:00' },
    },
  },
  
  invalid: {
    name: '', // Missing required field
    description: 'Interactive museum',
    address: '700 Exposition Park Dr, Los Angeles, CA 90037',
    phone: '213-555-0400', // Missing country code
    email: 'invalid-email', // Invalid email format
    website: 'not-a-url', // Invalid URL format
    category: 'museum',
    subcategory: 'science',
    capacity: -10, // Invalid capacity
    parkingAvailable: true,
    wheelchairAccessible: true,
    foodServiceAvailable: true,
    giftShopAvailable: true,
    indoorFacility: true,
    outdoorFacility: false,
    ageRangeMin: 25, // Invalid age range (min > max)
    ageRangeMax: 18,
    operatingHours: {
      monday: { open: '25:00', close: '17:00' }, // Invalid time
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { open: '10:00', close: '18:00' },
    },
  },
};

// Payment form data
export const paymentFormFixtures = {
  valid: {
    cardNumber: '4242424242424242',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    cardholderName: 'Jennifer Johnson',
    billingAddress: {
      line1: '123 Main St',
      line2: 'Apt 4B',
      city: 'Anytown',
      state: 'CA',
      postalCode: '90210',
      country: 'US',
    },
    saveCard: false,
  },
  
  minimal: {
    cardNumber: '4000056655665556',
    expiryMonth: '06',
    expiryYear: '2026',
    cvc: '456',
    cardholderName: 'John Doe',
    billingAddress: {
      line1: '456 Oak Ave',
      line2: '',
      city: 'Springfield',
      state: 'CA',
      postalCode: '90123',
      country: 'US',
    },
    saveCard: true,
  },
  
  invalid: {
    cardNumber: '1234567890123456', // Invalid card number
    expiryMonth: '13', // Invalid month
    expiryYear: '2020', // Expired year
    cvc: '12', // Invalid CVC length
    cardholderName: '', // Missing required field
    billingAddress: {
      line1: '', // Missing required field
      line2: '',
      city: 'Anytown',
      state: 'CA',
      postalCode: '90210',
      country: 'US',
    },
    saveCard: false,
  },
};

// School registration form data
export const schoolFormFixtures = {
  valid: {
    name: 'Riverside Elementary School',
    district: 'Riverside School District',
    address: '123 School St, Riverside, CA 92501',
    phone: '+1-951-555-0100',
    email: 'info@riverside-elementary.edu',
    principalName: 'Dr. Emily Johnson',
    studentCount: 450,
    gradeLevels: ['K', '1', '2', '3', '4', '5'],
    website: 'https://riverside-elementary.edu',
  },
  
  minimal: {
    name: 'Small Elementary',
    district: 'Local District',
    address: '789 School Rd, Smalltown, CA 90001',
    phone: '+1-555-0200',
    email: 'info@small-elementary.edu',
    principalName: 'Ms. Sarah Smith',
    studentCount: 150,
    gradeLevels: ['K', '1', '2', '3'],
    website: '',
  },
  
  invalid: {
    name: '', // Missing required field
    district: 'Riverside School District',
    address: '123 School St, Riverside, CA 92501',
    phone: '951-555-0100', // Missing country code
    email: 'invalid-email', // Invalid email format
    principalName: 'Dr. Emily Johnson',
    studentCount: -50, // Invalid student count
    gradeLevels: [], // Empty grade levels
    website: 'not-a-url', // Invalid URL format
  },
};

// Contact form data (for landing page)
export const contactFormFixtures = {
  valid: {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1-555-0300',
    organization: 'Wilson Elementary School',
    role: 'teacher',
    subject: 'Interested in field trip opportunities',
    message: 'Hi, I\'m interested in learning more about field trip opportunities for my 4th grade class. We\'re particularly interested in science museums and nature centers.',
  },
  
  minimal: {
    name: 'Mike Brown',
    email: 'mike.brown@example.com',
    phone: '',
    organization: '',
    role: 'parent',
    subject: 'General inquiry',
    message: 'I have a question about your services.',
  },
  
  invalid: {
    name: '', // Missing required field
    email: 'invalid-email', // Invalid email format
    phone: '+1-555-0300',
    organization: 'Wilson Elementary School',
    role: 'teacher',
    subject: '', // Missing required field
    message: '', // Missing required field
  },
};

// Helper functions to create form data variations
export const createFormFixture = <T>(baseFixture: T, overrides: Partial<T> = {}): T => ({
  ...baseFixture,
  ...overrides,
});

export const createValidationErrors = (fields: string[]) => {
  return fields.reduce((errors, field) => {
    errors[field] = `${field} is required`;
    return errors;
  }, {} as Record<string, string>);
};

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  url: /^https?:\/\/.+/,
  time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  postalCode: /^\d{5}(-\d{4})?$/,
  cardNumber: /^\d{13,19}$/,
  cvc: /^\d{3,4}$/,
};