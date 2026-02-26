import { useState } from 'react';
import { Button } from '@tripslip/ui';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
}

interface EditTeacherModalProps {
  teacher: Teacher;
  onClose: () => void;
  onSave: (teacherId: string, updates: Partial<Teacher>) => Promise<void>;
}

export default function EditTeacherModal({ teacher, onClose, onSave }: EditTeacherModalProps) {
  const [firstName, setFirstName] = useState(teacher.first_name);
  const [lastName, setLastName] = useState(teacher.last_name);
  const [email, setEmail] = useState(teacher.email);
  const [phone, setPhone] = useState(teacher.phone || '');
  const [department, setDepartment] = useState(teacher.department || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await onSave(teacher.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        department: department.trim() || null,
      });
    } catch (err) {
      setError('Failed to update teacher. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-black rounded-lg shadow-offset max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Edit Teacher</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black rounded-md"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Department (optional)
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black rounded-md"
                placeholder="e.g., Science, Math, History"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border-2 border-red-600 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
