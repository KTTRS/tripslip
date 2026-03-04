/**
 * Component fixtures for testing React components
 * Provides props and state data for component testing
 */

import { ReactNode } from 'react';

// Common component prop fixtures
export const componentFixtures = {
  // Button component props
  button: {
    primary: {
      variant: 'primary' as const,
      size: 'medium' as const,
      children: 'Click me',
      disabled: false,
      loading: false,
    },
    secondary: {
      variant: 'secondary' as const,
      size: 'medium' as const,
      children: 'Cancel',
      disabled: false,
      loading: false,
    },
    loading: {
      variant: 'primary' as const,
      size: 'medium' as const,
      children: 'Loading...',
      disabled: false,
      loading: true,
    },
    disabled: {
      variant: 'primary' as const,
      size: 'medium' as const,
      children: 'Disabled',
      disabled: true,
      loading: false,
    },
  },
  
  // Input component props
  input: {
    text: {
      type: 'text' as const,
      placeholder: 'Enter text',
      value: '',
      disabled: false,
      required: false,
      error: '',
    },
    email: {
      type: 'email' as const,
      placeholder: 'Enter email',
      value: 'test@example.com',
      disabled: false,
      required: true,
      error: '',
    },
    password: {
      type: 'password' as const,
      placeholder: 'Enter password',
      value: '',
      disabled: false,
      required: true,
      error: '',
    },
    withError: {
      type: 'text' as const,
      placeholder: 'Enter text',
      value: '',
      disabled: false,
      required: true,
      error: 'This field is required',
    },
    disabled: {
      type: 'text' as const,
      placeholder: 'Disabled input',
      value: 'Cannot edit',
      disabled: true,
      required: false,
      error: '',
    },
  },
  
  // Modal component props
  modal: {
    open: {
      isOpen: true,
      onClose: () => {},
      title: 'Test Modal',
      children: 'Modal content goes here',
    },
    closed: {
      isOpen: false,
      onClose: () => {},
      title: 'Test Modal',
      children: 'Modal content goes here',
    },
    withActions: {
      isOpen: true,
      onClose: () => {},
      title: 'Confirm Action',
      children: 'Are you sure you want to proceed?',
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        { label: 'Confirm', variant: 'primary' as const, onClick: () => {} },
      ],
    },
  },
  
  // Card component props
  card: {
    basic: {
      title: 'Card Title',
      children: 'Card content goes here',
    },
    withImage: {
      title: 'Card with Image',
      image: 'https://example.com/image.jpg',
      imageAlt: 'Test image',
      children: 'Card content with image',
    },
    withActions: {
      title: 'Card with Actions',
      children: 'Card content',
      actions: [
        { label: 'Edit', onClick: () => {} },
        { label: 'Delete', onClick: () => {}, variant: 'destructive' as const },
      ],
    },
  },
  
  // Table component props
  table: {
    basic: {
      columns: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'role', label: 'Role', sortable: false },
      ],
      data: [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Teacher' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Parent' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Admin' },
      ],
      loading: false,
      error: null,
    },
    loading: {
      columns: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
      ],
      data: [],
      loading: true,
      error: null,
    },
    error: {
      columns: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
      ],
      data: [],
      loading: false,
      error: 'Failed to load data',
    },
    empty: {
      columns: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
      ],
      data: [],
      loading: false,
      error: null,
    },
  },
  
  // Form component props
  form: {
    permissionSlip: {
      initialValues: {
        studentName: '',
        studentGrade: '',
        studentDob: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        medicalConditions: '',
        medications: '',
        dietaryRestrictions: '',
        photoPermission: false,
        pickupPermission: false,
        specialInstructions: '',
        signature: '',
      },
      validationSchema: {},
      onSubmit: () => {},
      loading: false,
      error: null,
    },
    trip: {
      initialValues: {
        title: '',
        description: '',
        venueId: '',
        experienceId: '',
        tripDate: '',
        departureTime: '',
        returnTime: '',
        maxParticipants: 0,
        gradeLevel: '',
        subjectArea: '',
        learningObjectives: [],
        specialRequirements: '',
        transportationMethod: '',
        lunchArrangement: '',
        emergencyContact: '',
      },
      validationSchema: {},
      onSubmit: () => {},
      loading: false,
      error: null,
    },
  },
  
  // Navigation component props
  navigation: {
    teacher: {
      user: {
        id: 'teacher-123',
        email: 'teacher@school.edu',
        name: 'Jane Teacher',
        role: 'teacher',
      },
      currentPath: '/teacher/dashboard',
      menuItems: [
        { label: 'Dashboard', path: '/teacher/dashboard', icon: 'dashboard' },
        { label: 'Trips', path: '/teacher/trips', icon: 'trips' },
        { label: 'Students', path: '/teacher/students', icon: 'students' },
        { label: 'Profile', path: '/teacher/profile', icon: 'profile' },
      ],
    },
    parent: {
      user: {
        id: 'parent-123',
        email: 'parent@example.com',
        name: 'John Parent',
        role: 'parent',
      },
      currentPath: '/parent/dashboard',
      menuItems: [
        { label: 'Dashboard', path: '/parent/dashboard', icon: 'dashboard' },
        { label: 'Permission Slips', path: '/parent/slips', icon: 'slips' },
        { label: 'Payments', path: '/parent/payments', icon: 'payments' },
        { label: 'Profile', path: '/parent/profile', icon: 'profile' },
      ],
    },
    venue: {
      user: {
        id: 'venue-admin-123',
        email: 'admin@venue.com',
        name: 'Sarah Admin',
        role: 'venue_admin',
      },
      currentPath: '/venue/dashboard',
      menuItems: [
        { label: 'Dashboard', path: '/venue/dashboard', icon: 'dashboard' },
        { label: 'Experiences', path: '/venue/experiences', icon: 'experiences' },
        { label: 'Bookings', path: '/venue/bookings', icon: 'bookings' },
        { label: 'Analytics', path: '/venue/analytics', icon: 'analytics' },
        { label: 'Profile', path: '/venue/profile', icon: 'profile' },
      ],
    },
  },
  
  // Dashboard component props
  dashboard: {
    teacher: {
      stats: {
        totalTrips: 12,
        activeTrips: 3,
        totalStudents: 285,
        pendingSlips: 15,
      },
      recentTrips: [
        {
          id: 'trip-123',
          title: 'Science Museum Visit',
          date: '2024-06-15',
          status: 'published',
          studentCount: 25,
        },
        {
          id: 'trip-456',
          title: 'Zoo Field Trip',
          date: '2024-07-20',
          status: 'draft',
          studentCount: 30,
        },
      ],
      upcomingDeadlines: [
        {
          type: 'permission_slips',
          title: 'Permission slips due',
          date: '2024-06-01',
          count: 5,
        },
        {
          type: 'payment',
          title: 'Payment deadline',
          date: '2024-06-10',
          count: 8,
        },
      ],
    },
    parent: {
      stats: {
        totalChildren: 2,
        pendingSlips: 1,
        upcomingTrips: 2,
        totalPaid: 4500,
      },
      children: [
        {
          id: 'student-123',
          name: 'Emma Johnson',
          grade: '5',
          school: 'Riverside Elementary',
          upcomingTrips: 1,
          pendingSlips: 0,
        },
        {
          id: 'student-456',
          name: 'Liam Johnson',
          grade: '3',
          school: 'Riverside Elementary',
          upcomingTrips: 1,
          pendingSlips: 1,
        },
      ],
      recentActivity: [
        {
          type: 'slip_signed',
          message: 'Permission slip signed for Science Museum Visit',
          date: '2024-05-15',
        },
        {
          type: 'payment_made',
          message: 'Payment completed for Zoo Field Trip',
          date: '2024-05-10',
        },
      ],
    },
    venue: {
      stats: {
        totalBookings: 45,
        monthlyRevenue: 67500,
        averageRating: 4.7,
        activeExperiences: 8,
      },
      recentBookings: [
        {
          id: 'booking-123',
          school: 'Riverside Elementary',
          experience: 'Dinosaur Discovery Tour',
          date: '2024-06-15',
          students: 25,
          status: 'confirmed',
        },
        {
          id: 'booking-456',
          school: 'Lincoln Middle School',
          experience: 'Space Workshop',
          date: '2024-06-20',
          students: 30,
          status: 'pending',
        },
      ],
      upcomingEvents: [
        {
          date: '2024-06-15',
          events: [
            {
              time: '09:00',
              school: 'Riverside Elementary',
              experience: 'Dinosaur Tour',
              students: 25,
            },
            {
              time: '14:00',
              school: 'Oak Elementary',
              experience: 'Space Workshop',
              students: 20,
            },
          ],
        },
      ],
    },
  },
};

// Component state fixtures
export const componentStateFixtures = {
  loading: {
    isLoading: true,
    data: null,
    error: null,
  },
  
  success: <T>(data: T) => ({
    isLoading: false,
    data,
    error: null,
  }),
  
  error: (message: string = 'Something went wrong') => ({
    isLoading: false,
    data: null,
    error: { message },
  }),
  
  empty: {
    isLoading: false,
    data: [],
    error: null,
  },
};

// Event handler fixtures
export const eventHandlerFixtures = {
  onClick: () => {},
  onChange: () => {},
  onSubmit: () => {},
  onClose: () => {},
  onOpen: () => {},
  onSelect: () => {},
  onDelete: () => {},
  onEdit: () => {},
  onCancel: () => {},
  onConfirm: () => {},
};

// Helper functions for creating component fixtures
export const createComponentProps = <T>(baseProps: T, overrides: Partial<T> = {}): T => ({
  ...baseProps,
  ...overrides,
});

export const createEventHandlers = (handlers: Record<string, () => void>) => {
  const mockHandlers: Record<string, ReturnType<typeof vi.fn>> = {};
  
  Object.keys(handlers).forEach(key => {
    mockHandlers[key] = vi.fn();
  });
  
  return mockHandlers;
};

// Mock React Router fixtures
export const routerFixtures = {
  location: {
    pathname: '/test',
    search: '',
    hash: '',
    state: null,
    key: 'test-key',
  },
  
  navigate: vi.fn(),
  
  params: {
    id: 'test-id',
    slug: 'test-slug',
  },
  
  searchParams: new URLSearchParams('?page=1&limit=10'),
};

// Mock context fixtures
export const contextFixtures = {
  auth: {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    },
    session: {
      access_token: 'mock-token',
      expires_at: Date.now() + 3600000,
    },
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  },
  
  theme: {
    theme: 'light' as const,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  },
  
  language: {
    language: 'en' as const,
    setLanguage: vi.fn(),
    t: (key: string) => key,
    isRTL: false,
  },
};