import { useState } from 'react';
import { Button, Input } from '@tripslip/ui';
import { supabase } from '../../lib/supabase';
import type { Tables } from '@tripslip/database';
import { toast } from 'sonner';
import { X } from 'lucide-react';

type Student = Tables<'students'>;

interface EditStudentModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditStudentModal({ student, onClose, onSuccess }: EditStudentModalProps) {
  const [formData, setFormData] = useState({
    first_name: student.first_name,
    last_name: student.last_name,
    grade: student.grade || '',
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
      
      // Update student
      const { error } = await supabase
        .from('students')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          grade: formData.grade,
        })
        .eq('id', student.id);
      
      if (error) throw error;
      
      toast.success('Student updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border-2 border-black shadow-offset max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b-2 border-black">
          <h2 className="text-xl font-bold">Edit Student</h2>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
