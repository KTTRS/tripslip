import { useState } from 'react';
import { Button, Input } from '@tripslip/ui';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface AddStudentModalProps {
  tripId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStudentModal({ tripId, onClose, onSuccess }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    grade: '',
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.grade) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // For this implementation, we'll need to get the teacher's roster
      // In a complete system, there would be a way to select which roster to add to
      // For now, we'll create a default roster if none exists
      
      // Get current user (teacher)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Get teacher record
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (teacherError) throw teacherError;
      
      // Get or create a default roster for this teacher
      let { data: roster, error: rosterError } = await supabase
        .from('rosters')
        .select('id')
        .eq('teacher_id', teacher.id)
        .eq('name', 'Default Roster')
        .single();
      
      if (rosterError && rosterError.code === 'PGRST116') {
        // Roster doesn't exist, create it
        const { data: newRoster, error: createRosterError } = await supabase
          .from('rosters')
          .insert({
            teacher_id: teacher.id,
            name: 'Default Roster',
            grade_level: formData.grade
          })
          .select()
          .single();
        
        if (createRosterError) throw createRosterError;
        roster = newRoster;
      } else if (rosterError) {
        throw rosterError;
      }
      
      // Check for duplicate student in this roster
      const { data: existingStudents, error: checkError } = await supabase
        .from('students')
        .select('id')
        .eq('roster_id', roster!.id)
        .eq('first_name', formData.first_name)
        .eq('last_name', formData.last_name);
      
      if (checkError) throw checkError;
      
      if (existingStudents && existingStudents.length > 0) {
        toast.error('This student is already in the roster');
        return;
      }
      
      // Create student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          grade: formData.grade,
          roster_id: roster!.id,
        })
        .select()
        .single();
      
      if (studentError) throw studentError;
      
      // Create permission slip for the student and this trip
      const { error: slipError } = await supabase
        .from('permission_slips')
        .insert({
          student_id: student.id,
          trip_id: tripId,
          status: 'pending',
          magic_link_token: crypto.randomUUID(),
        });
      
      if (slipError) throw slipError;
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border-2 border-black shadow-offset max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b-2 border-black">
          <h2 className="text-xl font-bold">Add Student</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="border-2 border-black"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="border-2 border-black"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade *
            </label>
            <Input
              type="text"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="border-2 border-black"
              placeholder="e.g., 5th, 6th"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="shadow-offset"
            >
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
