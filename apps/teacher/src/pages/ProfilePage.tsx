import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { NoTeacherProfile } from '../components/NoTeacherProfile';
import { toast } from 'sonner';
import { User, Mail, Phone, School, Save, Key } from 'lucide-react';

export default function ProfilePage() {
  const { teacher, user, signOut } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
  });
  const [schoolName, setSchoolName] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new_password: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (teacher) {
      setFormData({
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        department: teacher.department || '',
      });

      if (teacher.school_id) {
        supabase
          .from('schools')
          .select('name')
          .eq('id', teacher.school_id)
          .single()
          .then(({ data }) => {
            if (data) setSchoolName(data.name);
          });
      }
    }
  }, [teacher]);

  const handleSave = async () => {
    if (!teacher) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('teachers')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          department: formData.department || null,
        })
        .eq('id', teacher.id);

      if (error) throw error;
      toast.success('Profile updated');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });
      if (error) throw error;
      toast.success('Password updated');
      setPasswordData({ current: '', new_password: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!teacher) {
    return (
      <Layout>
        <NoTeacherProfile />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-[#0A0A0A]">Profile</h1>

        <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="border-2 border-[#0A0A0A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="border-2 border-[#0A0A0A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border-2 border-gray-200 rounded-md px-3 py-2">
                <Mail className="h-4 w-4" />
                {user?.email || formData.email}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-2 border-gray-300"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="border-2 border-gray-300"
                  placeholder="e.g., Science"
                />
              </div>
            </div>

            {schoolName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border-2 border-gray-200 rounded-md px-3 py-2">
                  <School className="h-4 w-4" />
                  {schoolName}
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="border-2 border-gray-300"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <Input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="border-2 border-gray-300"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwordData.new_password}
              variant="outline"
              className="border-2 border-[#0A0A0A]"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button
            variant="outline"
            onClick={signOut}
            className="border-2 border-red-500 text-red-600 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </Layout>
  );
}
