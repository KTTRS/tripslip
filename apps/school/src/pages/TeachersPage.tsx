import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import TeacherList from '../components/TeacherList';
import AddTeacherModal from '../components/AddTeacherModal';
import EditTeacherModal from '../components/EditTeacherModal';

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [schoolId] = useState('default-school-id'); // TODO: Get from auth context

  useEffect(() => {
    fetchTeachers();
  }, [schoolId]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);

      // Fetch teachers for the school
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .order('last_name', { ascending: true });

      if (teachersError) throw teachersError;

      // Fetch trip counts for each teacher
      const teacherIds = teachersData?.map(t => t.id) || [];
      const { data: tripsData } = await supabase
        .from('trips')
        .select('teacher_id, permission_slips(student_id)')
        .in('teacher_id', teacherIds);

      // Calculate metrics for each teacher
      const teacherMetrics = new Map<string, { tripCount: number; studentCount: number }>();
      (tripsData || []).forEach((trip: any) => {
        const teacherId = trip.teacher_id;
        if (!teacherMetrics.has(teacherId)) {
          teacherMetrics.set(teacherId, { tripCount: 0, studentCount: 0 });
        }
        const metrics = teacherMetrics.get(teacherId)!;
        metrics.tripCount += 1;
        metrics.studentCount += trip.permission_slips?.length || 0;
      });

      // Combine teacher data with metrics
      const enrichedTeachers: Teacher[] = (teachersData || []).map((teacher: any) => {
        const metrics = teacherMetrics.get(teacher.id) || { tripCount: 0, studentCount: 0 };
        return {
          ...teacher,
          is_active: teacher.user_id !== null, // Active if linked to auth user
          can_create_trips: teacher.can_create_trips ?? true,
          can_manage_students: teacher.can_manage_students ?? true,
          department: teacher.department,
          trip_count: metrics.tripCount,
          student_count: metrics.studentCount,
          last_login: null, // TODO: Track last login
        };
      });

      setTeachers(enrichedTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (teacherData: { firstName: string; lastName: string; email: string; phone?: string }) => {
    try {
      // Insert new teacher
      const { error: insertError } = await supabase
        .from('teachers')
        .insert({
          school_id: schoolId,
          first_name: teacherData.firstName,
          last_name: teacherData.lastName,
          email: teacherData.email,
          phone: teacherData.phone || null,
          independent: false,
        });

      if (insertError) throw insertError;

      // Send invitation email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'teacher_invitation',
          to: teacherData.email,
          data: {
            teacher_name: `${teacherData.firstName} ${teacherData.lastName}`,
            school_id: schoolId,
          },
        },
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't throw - teacher was created successfully
      }

      // Refresh teacher list
      await fetchTeachers();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding teacher:', error);
      throw error;
    }
  };

  const handleEditTeacher = async (teacherId: string, updates: Partial<Teacher>) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .update({
          first_name: updates.first_name,
          last_name: updates.last_name,
          email: updates.email,
          phone: updates.phone,
          department: updates.department,
        })
        .eq('id', teacherId);

      if (error) throw error;

      // Refresh teacher list
      await fetchTeachers();
      setEditingTeacher(null);
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  };

  const handleDeactivateTeacher = async (teacherId: string) => {
    try {
      // Set user_id to null to deactivate
      const { error } = await supabase
        .from('teachers')
        .update({ user_id: null })
        .eq('id', teacherId);

      if (error) throw error;

      // Refresh teacher list
      await fetchTeachers();
    } catch (error) {
      console.error('Error deactivating teacher:', error);
      throw error;
    }
  };

  const handleUpdatePermissions = async (teacherId: string, permissions: { can_create_trips: boolean; can_manage_students: boolean }) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .update({
          can_create_trips: permissions.can_create_trips,
          can_manage_students: permissions.can_manage_students,
        })
        .eq('id', teacherId);

      if (error) throw error;

      // Refresh teacher list
      await fetchTeachers();
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold font-display">TripSlip School</h1>
          <div className="flex gap-4">
            <Link to="/" className="px-4 py-2 font-semibold hover:bg-gray-100 rounded">
              Dashboard
            </Link>
            <Link to="/teachers" className="px-4 py-2 font-semibold hover:bg-gray-100 rounded">
              Teachers
            </Link>
            <Link to="/approvals" className="px-4 py-2 font-semibold hover:bg-gray-100 rounded">
              Approvals
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Teacher Management</h2>
          <Button onClick={() => setShowAddModal(true)}>
            Add Teacher
          </Button>
        </div>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle>Teachers ({teachers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <TeacherList
              teachers={teachers}
              onEdit={setEditingTeacher}
              onDeactivate={handleDeactivateTeacher}
              onUpdatePermissions={handleUpdatePermissions}
            />
          </CardContent>
        </Card>
      </main>

      {showAddModal && (
        <AddTeacherModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTeacher}
        />
      )}

      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSave={handleEditTeacher}
        />
      )}
    </div>
  );
}
