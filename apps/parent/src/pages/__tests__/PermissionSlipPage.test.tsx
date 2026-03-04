import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { PermissionSlipPage } from '../PermissionSlipPage';

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: new Error('Not found') }))
        }))
      }))
    }))
  }
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'permissionSlip.invalidLink') return 'Invalid permission slip link';
      if (key === 'permissionSlip.errorTitle') return 'Unable to Load Permission Slip';
      if (key === 'permissionSlip.notFound') return 'This permission slip could not be found';
      if (key === 'common.goHome') return 'Go to Home';
      return key;
    }
  })
}));

// Mock react-router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children
  };
});

// Mock Logger
vi.mock('@tripslip/utils', () => ({
  Logger: class {
    debug = vi.fn();
    info = vi.fn();
    error = vi.fn();
  }
}));

describe('PermissionSlipPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error state when no token is provided', async () => {
    render(
      <BrowserRouter>
        <PermissionSlipPage />
      </BrowserRouter>
    );

    // Should show error message for invalid link
    expect(await screen.findByText('Unable to Load Permission Slip')).toBeInTheDocument();
    expect(screen.getByText('Invalid permission slip link')).toBeInTheDocument();
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
  });

  it('renders the component without crashing', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <PermissionSlipPage />
        </BrowserRouter>
      );
    }).not.toThrow();
  });
});