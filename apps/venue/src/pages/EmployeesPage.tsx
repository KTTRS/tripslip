import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { toast } from 'sonner';

interface VenueUser {
  id: string;
  user_id: string;
  venue_id: string;
  role: string;
  created_at: string;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  deactivated_at: string | null;
}

export function EmployeesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<VenueUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'staff' as string,
  });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);

  useEffect(() => {
    loadVenueId();
  }, [user]);

  useEffect(() => {
    if (venueId) {
      loadEmployees();
    }
  }, [venueId]);

  const loadVenueId = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      setVenueId(data.venue_id);
    } catch (err) {
      console.error('Error loading venue ID:', err);
      setError('Failed to load venue information');
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!venueId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('venue_users')
        .select('*')
        .eq('venue_id', venueId)
        .is('deactivated_at', null)
        .order('created_at', { ascending: true });
      if (fetchError) throw fetchError;
      setEmployees(data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId || !user) return;
    setInviting(true);
    setError(null);
    try {
      const signupLink = `${window.location.origin}/venue/signup?email=${encodeURIComponent(inviteForm.email)}&venue=${venueId}`;
      
      try {
        await navigator.clipboard.writeText(signupLink);
      } catch {
        // clipboard may not be available
      }
      
      toast.success(`Invitation ready! Share this signup link with ${inviteForm.email}: ${signupLink}`);
      setShowInviteDialog(false);
      setInviteForm({ email: '', role: 'staff' });
    } catch (err) {
      console.error('Error inviting:', err);
      setError('Failed to create invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleDeactivate = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      const { error } = await supabase
        .from('venue_users')
        .update({ deactivated_at: new Date().toISOString() })
        .eq('id', employeeId);
      if (error) throw error;
      toast.success('Team member removed');
      loadEmployees();
    } catch (err) {
      console.error('Error deactivating:', err);
      toast.error('Failed to remove team member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-purple-100 text-purple-800 border-purple-800';
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

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team members...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold font-['Fraunces']">
              {t('employees.title', 'Team Members')}
            </h2>
            <p className="text-gray-600 mt-2">
              {t('employees.subtitle', 'Manage your venue team')}
            </p>
          </div>
          <button
            onClick={() => setShowInviteDialog(true)}
            className="bg-[#F5C518] text-[#0A0A0A] px-6 py-3 font-semibold border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {t('employees.inviteButton', 'Add Team Member')}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-800 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white border-2 border-[#0A0A0A] rounded-lg shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-[#0A0A0A]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">User ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#0A0A0A]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-500 text-lg mb-2">No team members yet</p>
                    <p className="text-gray-400 text-sm">Add team members to help manage your venue</p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-[#0A0A0A] font-mono">
                      {emp.user_id === user?.id ? (
                        <span className="font-semibold">You</span>
                      ) : (
                        emp.user_id.substring(0, 8) + '...'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold border rounded ${getRoleBadgeColor(emp.role)}`}>
                        {formatRole(emp.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 text-xs font-semibold border rounded bg-green-100 text-green-800 border-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {emp.user_id !== user?.id && (
                        <button
                          onClick={() => handleDeactivate(emp.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showInviteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-[#0A0A0A] rounded-lg p-6 max-w-md w-full shadow-[4px_4px_0px_#0A0A0A]">
              <h3 className="font-['Fraunces'] text-2xl font-bold text-[#0A0A0A] mb-4">
                Add Team Member
              </h3>
              <form onSubmit={handleInviteSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[#0A0A0A] rounded focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                    placeholder="team@example.com"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
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
                    {inviting ? 'Adding...' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1 bg-white text-[#0A0A0A] px-6 py-3 font-semibold border-2 border-[#0A0A0A] hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
