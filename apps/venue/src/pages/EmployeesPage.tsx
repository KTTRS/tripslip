import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createVenueEmployeeService, type InvitationStatus } from '@tripslip/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function EmployeesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<InvitationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    employeeName: '',
    role: 'staff' as 'manager' | 'staff',
  });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get venue ID from current user's employee record
  const [venueId, setVenueId] = useState<string | null>(null);

  useEffect(() => {
    loadVenueId();
  }, [user]);

  useEffect(() => {
    if (venueId) {
      loadEmployeesAndInvitations();
    }
  }, [venueId]);

  const loadVenueId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('venue_employees')
        .select('venue_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setVenueId(data.venue_id);
    } catch (err) {
      console.error('Error loading venue ID:', err);
      setError('Failed to load venue information');
    }
  };

  const loadEmployeesAndInvitations = async () => {
    if (!venueId) return;

    setLoading(true);
    setError(null);

    try {
      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('venue_employees')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false });

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Load invitations
      const employeeService = createVenueEmployeeService(supabase);
      const invitationsData = await employeeService.getVenueInvitations(venueId);
      setInvitations(invitationsData);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employees and invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId || !user) return;

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const employeeService = createVenueEmployeeService(supabase);
      const result = await employeeService.sendInvitation({
        email: inviteForm.email,
        employeeName: inviteForm.employeeName,
        role: inviteForm.role,
        venueId,
        invitedBy: user.id,
      });

      if (result.success) {
        setSuccess('Invitation sent successfully!');
        setShowInviteDialog(false);
        setInviteForm({ email: '', employeeName: '', role: 'staff' });
        loadEmployeesAndInvitations();
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const employeeService = createVenueEmployeeService(supabase);
      const result = await employeeService.resendInvitation(invitationId);

      if (result.success) {
        setSuccess('Invitation resent successfully!');
        loadEmployeesAndInvitations();
      } else {
        setError(result.error || 'Failed to resend invitation');
      }
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError('Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    setError(null);
    setSuccess(null);

    try {
      const employeeService = createVenueEmployeeService(supabase);
      const result = await employeeService.cancelInvitation(invitationId);

      if (result.success) {
        setSuccess('Invitation cancelled successfully');
        loadEmployeesAndInvitations();
      } else {
        setError(result.error || 'Failed to cancel invitation');
      }
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError('Failed to cancel invitation');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-800';
      case 'staff':
        return 'bg-gray-100 text-gray-800 border-gray-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-fraunces text-4xl font-bold text-[#0A0A0A] mb-2">
          {t('employees.title', 'Team Members')}
        </h1>
        <p className="text-gray-600">
          {t('employees.subtitle', 'Manage your venue team and send invitations')}
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-800 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-800 rounded">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Invite Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowInviteDialog(true)}
          className="bg-[#F5C518] text-[#0A0A0A] px-6 py-3 font-semibold border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {t('employees.inviteButton', 'Invite Employee')}
        </button>
      </div>

      {/* Current Employees */}
      <div className="mb-8">
        <h2 className="font-fraunces text-2xl font-bold text-[#0A0A0A] mb-4">
          {t('employees.currentEmployees', 'Current Employees')}
        </h2>
        <div className="bg-white border-2 border-[#0A0A0A] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-[#0A0A0A]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-[#0A0A0A]">{employee.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold border rounded ${getRoleBadgeColor(employee.role)}`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(employee.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      <div>
        <h2 className="font-fraunces text-2xl font-bold text-[#0A0A0A] mb-4">
          {t('employees.pendingInvitations', 'Pending Invitations')}
        </h2>
        <div className="bg-white border-2 border-[#0A0A0A] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-[#0A0A0A]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Expires</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No pending invitations
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-[#0A0A0A]">{invitation.employeeName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{invitation.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold border rounded ${getRoleBadgeColor(invitation.role)}`}>
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold border rounded ${getStatusBadgeColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {invitation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleResendInvitation(invitation.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Resend
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#0A0A0A] rounded-lg p-6 max-w-md w-full">
            <h3 className="font-fraunces text-2xl font-bold text-[#0A0A0A] mb-4">
              {t('employees.inviteDialog.title', 'Invite Employee')}
            </h3>
            <form onSubmit={handleInviteSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                  {t('employees.inviteDialog.name', 'Employee Name')}
                </label>
                <input
                  type="text"
                  value={inviteForm.employeeName}
                  onChange={(e) => setInviteForm({ ...inviteForm, employeeName: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#0A0A0A] rounded focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                  {t('employees.inviteDialog.email', 'Email Address')}
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-[#0A0A0A] rounded focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                  {t('employees.inviteDialog.role', 'Role')}
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'manager' | 'staff' })}
                  className="w-full px-4 py-2 border-2 border-[#0A0A0A] rounded focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-[#F5C518] text-[#0A0A0A] px-6 py-3 font-semibold border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? 'Sending...' : t('employees.inviteDialog.send', 'Send Invitation')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteDialog(false)}
                  className="flex-1 bg-white text-[#0A0A0A] px-6 py-3 font-semibold border-2 border-[#0A0A0A] hover:bg-gray-50 transition-colors"
                >
                  {t('employees.inviteDialog.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
