import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RosterManager } from '../RosterManager';

// Mock Supabase client
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      }))
    }))
  }))
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock child components
vi.mock('../roster/AddStudentModal', () => ({
  AddStudentModal: () => <div data-testid="add-student-modal">Add Student Modal</div>
}));

vi.mock('../roster/EditStudentModal', () => ({
  EditStudentModal: () => <div data-testid="edit-student-modal">Edit Student Modal</div>
}));

vi.mock('../roster/CSVImportModal', () => ({
  CSVImportModal: () => <div data-testid="csv-import-modal">CSV Import Modal</div>
}));

describe('RosterManager', () => {
  const mockTripId = 'test-trip-id';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders without crashing', () => {
    const { container } = render(<RosterManager tripId={mockTripId} />);
    expect(container).toBeTruthy();
  });
  
  it('renders empty state when no students', async () => {
    render(<RosterManager tripId={mockTripId} />);
    
    await waitFor(() => {
      expect(screen.getByText('No students in this trip yet')).toBeDefined();
    });
  });
  
  it('renders action buttons', async () => {
    render(<RosterManager tripId={mockTripId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Student')).toBeDefined();
      expect(screen.getByText('Import CSV')).toBeDefined();
      expect(screen.getByText('CSV Template')).toBeDefined();
    });
  });
  
  it('renders search input', async () => {
    render(<RosterManager tripId={mockTripId} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search students...')).toBeDefined();
    });
  });
  
  it('displays student count', async () => {
    render(<RosterManager tripId={mockTripId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/0 Total Students/)).toBeDefined();
    });
  });
  
  it('calls onStudentCountChange callback when students change', async () => {
    const onStudentCountChange = vi.fn();
    render(<RosterManager tripId={mockTripId} onStudentCountChange={onStudentCountChange} />);
    
    await waitFor(() => {
      expect(onStudentCountChange).toHaveBeenCalledWith(0);
    });
  });
});
