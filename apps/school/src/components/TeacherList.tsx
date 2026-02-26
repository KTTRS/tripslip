import { Button } from '@tripslip/ui';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  user_id: string | null;
  created_at: string;
  is_active: boolean;
  can_create_trips: boolean;
  can_manage_students: boolean;
  department: string | null;
  trip_count: number;
  student_count: number;
  last_login: string | null;
}

interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDeactivate: (teacherId: string) => void;
  onUpdatePermissions: (teacherId: string, permissions: { can_create_trips: boolean; can_manage_students: boolean }) => void;
}

export default function TeacherList({ teachers, onEdit, onDeactivate, onUpdatePermissions }: TeacherListProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (teachers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No teachers found</p>
        <p className="text-gray-500 text-sm mt-2">Add your first teacher to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teachers.map((teacher) => (
        <div
          key={teacher.id}
          className={`p-4 border-2 border-black rounded-md ${
            !teacher.is_active ? 'bg-gray-100 opacity-75' : 'bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold">
                  {teacher.first_name} {teacher.last_name}
                </h3>
                {!teacher.is_active && (
                  <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                    Deactivated
                  </span>
                )}
                {teacher.is_active && (
                  <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                    Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{teacher.email}</p>
                </div>
                {teacher.phone && (
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{teacher.phone}</p>
                  </div>
                )}
                {teacher.department && (
                  <div>
                    <p className="text-gray-600">Department</p>
                    <p className="font-medium">{teacher.department}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold mb-2">Activity Metrics</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Trips Created</p>
                    <p className="text-2xl font-bold">{teacher.trip_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Students Managed</p>
                    <p className="text-2xl font-bold">{teacher.student_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Login</p>
                    <p className="text-sm font-medium">{formatDate(teacher.last_login)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold mb-2">Permissions</h4>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={teacher.can_create_trips}
                      onChange={(e) =>
                        onUpdatePermissions(teacher.id, {
                          can_create_trips: e.target.checked,
                          can_manage_students: teacher.can_manage_students,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>Can create trips</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={teacher.can_manage_students}
                      onChange={(e) =>
                        onUpdatePermissions(teacher.id, {
                          can_create_trips: teacher.can_create_trips,
                          can_manage_students: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>Can manage students</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(teacher)}
              >
                Edit
              </Button>
              {teacher.is_active ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to deactivate ${teacher.first_name} ${teacher.last_name}? They will no longer be able to log in or create trips.`)) {
                      onDeactivate(teacher.id);
                    }
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-gray-400"
                >
                  Deactivated
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
