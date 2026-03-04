import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeacherInvitation } from '../TeacherInvitation';
import { supabase } from '@tripslip/database';

vi.mock('@tripslip/database', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('TeacherInvitation', () => {
  const mockInvitations = [
    {
      id: 'inv-1',
      school_id: 'school-1',
      email: 'teacher1@school.edu',
      status: 'pending',
      created_at: '2024-06-01T00:00:00Z',
      expires_at: '2024-06-08T00:00:00Z',
      invitation_token: 'token-123',
    },
    {
      id: 'inv-2',
      school_id: 'school-1',
      email: 'teacher2@school.edu',
      status: 'accepted',
      created_at: '2024-05-25T00:00:00Z',
      expires_at: '2024-06-01T00:00:00Z',
      invitation_token: 'token-456',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invitation form', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockInvitations,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<TeacherInvitation schoolId="school-1" />);

    expect(screen.getByText('Invite Teachers')).toBeInTheDocument();
    expect(screen.getByLabelText('Teacher Email')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send invitation/i })
    ).toBeInTheDocument();
  });

  it('displays sent invitations', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockInvitations,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    render(<TeacherInvitation schoolId="school-1" />);

    await waitFor(() => {
      expect(screen.getByText('teacher1@school.edu')).toBeInTheDocument();
    });

    expect(screen.getByText('teacher2@school.edu')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('accepted')).toBeInTheDocument();
  });

  it('sends new invitation', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }),
    });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'teacher_invitations') {
        return {
          select: mockSelect,
          insert: mockInsert,
        } as any;
      }
      return {} as any;
    });

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: null,
    } as any);

    const user = userEvent.setup();
    render(<TeacherInvitation schoolId="school-1" />);

    const emailInput = screen.getByLabelText('Teacher Email');
    await user.type(emailInput, 'newteacher@school.edu');

    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
      body: expect.objectContaining({
        to: 'newteacher@school.edu',
        template: 'teacher-invitation',
      }),
    });
  });

  it('prevents duplicate invitations', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: { email: 'teacher1@school.edu' },
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const user = userEvent.setup();
    render(<TeacherInvitation schoolId="school-1" />);

    const emailInput = screen.getByLabelText('Teacher Email');
    await user.type(emailInput, 'teacher1@school.edu');

    const submitButton = screen.getByRole('button', {
      name: /send invitation/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/invitation has already been sent/i)
      ).toBeInTheDocument();
    });
  });

  it('resends invitation', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockInvitations,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: null,
    } as any);

    const user = userEvent.setup();
    render(<TeacherInvitation schoolId="school-1" />);

    await waitFor(() => {
      expect(screen.getByText('teacher1@school.edu')).toBeInTheDocument();
    });

    const resendButton = screen.getByRole('button', { name: /resend/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: expect.objectContaining({
          to: 'teacher1@school.edu',
        }),
      });
    });
  });

  it('revokes invitation', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockInvitations,
          error: null,
        }),
      }),
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'teacher_invitations') {
        return {
          select: mockSelect,
          update: mockUpdate,
        } as any;
      }
      return {} as any;
    });

    const user = userEvent.setup();
    render(<TeacherInvitation schoolId="school-1" />);

    await waitFor(() => {
      expect(screen.getByText('teacher1@school.edu')).toBeInTheDocument();
    });

    const revokeButton = screen.getByRole('button', { name: /revoke/i });
    await user.click(revokeButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'expired' });
    });
  });
});
