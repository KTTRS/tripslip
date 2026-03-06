import { useState } from 'react';
import { Button, Input } from '@tripslip/ui';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface AddStudentModalProps {
  tripId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStudentModal({ tripId, onClose, onSuccess }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    grade: '',
    date_of_birth: '',
    parent_first_name: '',
    parent_last_name: '',
    parent_email: '',
    parent_phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.grade) {
      toast.error('Please fill in student name and grade');
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError) throw teacherError;

      let { data: roster, error: rosterError } = await supabase
        .from('rosters')
        .select('id')
        .eq('teacher_id', teacher.id)
        .eq('name', 'Default Roster')
        .single();

      if (rosterError && rosterError.code === 'PGRST116') {
        const { data: newRoster, error: createRosterError } = await supabase
          .from('rosters')
          .insert({
            teacher_id: teacher.id,
            name: 'Default Roster',
            grade_level: formData.grade,
          })
          .select()
          .single();

        if (createRosterError) throw createRosterError;
        roster = newRoster;
      } else if (rosterError) {
        throw rosterError;
      }

      const { data: existingStudents } = await supabase
        .from('students')
        .select('id')
        .eq('roster_id', roster!.id)
        .eq('first_name', formData.first_name)
        .eq('last_name', formData.last_name);

      if (existingStudents && existingStudents.length > 0) {
        toast.error('This student is already in the roster');
        return;
      }

      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          grade: formData.grade,
          date_of_birth: formData.date_of_birth || null,
          roster_id: roster!.id,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      if (formData.parent_first_name && formData.parent_last_name) {
        const { data: parent, error: parentError } = await supabase
          .from('parents')
          .insert({
            first_name: formData.parent_first_name,
            last_name: formData.parent_last_name,
            email: formData.parent_email || null,
            phone: formData.parent_phone || null,
          })
          .select()
          .single();

        if (!parentError && parent) {
          await supabase.from('student_parents').insert({
            student_id: student.id,
            parent_id: parent.id,
            relationship: 'Parent',
            primary_contact: true,
          });
        }
      }

      if (tripId) {
        const { error: slipError } = await supabase
          .from('permission_slips')
          .insert({
            student_id: student.id,
            trip_id: tripId,
            status: 'pending',
            magic_link_token: crypto.randomUUID(),
          });

        if (slipError) throw slipError;
      }

      toast.success('Student added successfully');
      onSuccess();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b-2 border-[#0A0A0A]">
          <h2 className="text-xl font-bold text-[#0A0A0A]">Add Student</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <Input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="border-2 border-[#0A0A0A]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <Input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="border-2 border-[#0A0A0A]"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                <Input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="border-2 border-[#0A0A0A]"
                  placeholder="e.g., 5th"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="border-2 border-[#0A0A0A]"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Parent / Guardian (optional)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <Input
                  type="text"
                  value={formData.parent_first_name}
                  onChange={(e) => setFormData({ ...formData, parent_first_name: e.target.value })}
                  className="border-2 border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <Input
                  type="text"
                  value={formData.parent_last_name}
                  onChange={(e) => setFormData({ ...formData, parent_last_name: e.target.value })}
                  className="border-2 border-gray-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                  className="border-2 border-gray-300"
                  placeholder="parent@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  className="border-2 border-gray-300"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="border-2 border-[#0A0A0A]">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold"
            >
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
