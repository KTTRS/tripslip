import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '@tripslip/database';

type Teacher = Database['public']['Tables']['teachers']['Row'];

interface TeacherInvitationProps {
  schoolId: string;
}

export const TeacherInvitation: React.FC<TeacherInvitationProps> = ({
  schoolId,
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadTeachers();
  }, [schoolId]);

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Check if teacher already exists
      const { data: existing } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .eq('school_id', schoolId)
        .single();

      if (existing) {
        setMessage({
          type: 'error',
          text: 'A teacher with this email already exists in your school',
        });
        setLoading(false);
        return;
      }

      // Create new teacher record
      const { error } = await supabase.from('teachers').insert({
        school_id: schoolId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        department: department || null,
        independent: false,
        can_create_trips: true,
        can_manage_students: true,
      });

      if (error) throw error;

      const signupLink = `${window.location.origin}/teacher/signup?email=${encodeURIComponent(email)}`;

      try {
        await navigator.clipboard.writeText(signupLink);
      } catch (clipErr) {
        // clipboard may not be available
      }

      setMessage({
        type: 'success',
        text: `Teacher added! Share this signup link with them: ${signupLink}`,
      });
      
      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setDepartment('');
      
      loadTeachers();
    } catch (error) {
      console.error('Error adding teacher:', error);
      setMessage({
        type: 'error',
        text: 'Failed to add teacher. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSignupLink = (teacherEmail: string) => {
    return `${window.location.origin}/teacher/signup?email=${encodeURIComponent(teacherEmail)}`;
  };

  const handleCopyLink = async (teacherId: string, teacherEmail: string) => {
    const link = getSignupLink(teacherEmail);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinkId(teacherId);
      setTimeout(() => setCopiedLinkId(null), 2000);
      setMessage({
        type: 'success',
        text: 'Signup link copied to clipboard!',
      });
    } catch {
      setMessage({
        type: 'success',
        text: `Signup link: ${link}`,
      });
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to remove this teacher?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Teacher removed successfully!',
      });
      loadTeachers();
    } catch (error) {
      console.error('Error removing teacher:', error);
      setMessage({
        type: 'error',
        text: 'Failed to remove teacher.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-fraunces font-semibold">
        Add Teachers
      </h2>

      {/* Teacher Form */}
      <form
        onSubmit={handleAddTeacher}
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-jakarta font-medium text-gray-700 mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-jakarta font-medium text-gray-700 mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-jakarta font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
              placeholder="teacher@school.edu"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-jakarta font-medium text-gray-700 mb-2"
              >
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-jakarta font-medium text-gray-700 mb-2"
              >
                Department (Optional)
              </label>
              <input
                type="text"
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
                placeholder="Science, Math, etc."
              />
            </div>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-tripslip-yellow text-black rounded-lg hover:bg-yellow-400 transition-colors shadow-offset disabled:opacity-50 disabled:cursor-not-allowed font-jakarta font-semibold"
          >
            {loading ? 'Adding Teacher...' : 'Add Teacher'}
          </button>
        </div>
      </form>

      {/* Teachers List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
        <h3 className="text-lg font-jakarta font-semibold mb-4">
          School Teachers ({teachers.length})
        </h3>

        {teachers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No teachers added yet
          </p>
        ) : (
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-jakarta font-medium">
                    {teacher.first_name} {teacher.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{teacher.email}</p>
                  {teacher.department && (
                    <p className="text-sm text-gray-500">
                      Department: {teacher.department}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Added: {new Date(teacher.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      teacher.user_id
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {teacher.user_id ? 'Active' : 'Pending'}
                  </span>
                  {!teacher.user_id && (
                    <button
                      onClick={() => handleCopyLink(teacher.id, teacher.email)}
                      className="px-3 py-1 text-sm bg-[#F5C518] text-[#0A0A0A] rounded hover:bg-yellow-400 transition-colors font-medium"
                    >
                      {copiedLinkId === teacher.id ? 'Copied!' : 'Copy Signup Link'}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveTeacher(teacher.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
