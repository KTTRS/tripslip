import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import type { Tables } from '@tripslip/database';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Plus, 
  Upload, 
  Download, 
  Edit2, 
  Trash2, 
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { AddStudentModal } from '../components/roster/AddStudentModal';
import { EditStudentModal } from '../components/roster/EditStudentModal';
import { CSVImportModal } from '../components/roster/CSVImportModal';

type Student = Tables<'students'>;
type PermissionSlip = Tables<'permission_slips'>;

interface StudentWithSlip extends Student {
  permission_slip?: PermissionSlip & {
    payments?: Array<{ status: string; amount_cents: number }>;
  };
}

export default function TripRosterPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState<any>(null);
  const [students, setStudents] = useState<StudentWithSlip[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  useEffect(() => {
    if (tripId) {
      fetchTripAndStudents();
    }
  }, [tripId]);
  
  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);
  
  const fetchTripAndStudents = async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('invitations')
        .select(`
          *,
          experience:experiences (
            title,
            cost_cents,
            venue:venues (name)
          )
        `)
        .eq('id', tripId)
        .single();
      
      if (tripError) throw tripError;
      setTrip(tripData);
      
      // Fetch students with permission slips
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          permission_slip:permission_slips (
            id,
            status,
            signed_at,
            payments (
              status,
              amount_cents
            )
          )
        `)
        .eq('invitation_id', tripId)
        .order('last_name', { ascending: true });
      
      if (studentsError) throw studentsError;
      
      // Transform data to handle single permission slip
      const transformedStudents = (studentsData || []).map((student: any) => ({
        ...student,
        permission_slip: Array.isArray(student.permission_slip) 
          ? student.permission_slip[0] 
          : student.permission_slip
      }));
      
      setStudents(transformedStudents);
      setFilteredStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching trip and students:', error);
      toast.error('Failed to load trip roster');
    } finally {
      setLoading(false);
    }
  };
  
  const filterStudents = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = students.filter((student) =>
      student.first_name.toLowerCase().includes(query) ||
      student.last_name.toLowerCase().includes(query) ||
      student.grade.toLowerCase().includes(query)
    );
    
    setFilteredStudents(filtered);
  };
  
  const getPermissionSlipStatus = (student: StudentWithSlip) => {
    if (!student.permission_slip) {
      return { label: 'Pending', color: 'gray', icon: Clock };
    }
    
    const slip = student.permission_slip;
    const hasPaidPayment = slip.payments?.some(p => p.status === 'succeeded');
    
    if (hasPaidPayment) {
      return { label: 'Paid', color: 'green', icon: CheckCircle };
    }
    
    if (slip.status === 'signed') {
      return { label: 'Signed', color: 'blue', icon: CheckCircle };
    }
    
    if (slip.status === 'cancelled') {
      return { label: 'Cancelled', color: 'red', icon: XCircle };
    }
    
    return { label: 'Pending', color: 'gray', icon: Clock };
  };
  
  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student? Their permission slip will be cancelled.')) {
      return;
    }
    
    try {
      // Mark permission slip as cancelled
      const { error: slipError } = await supabase
        .from('permission_slips')
        .update({ status: 'cancelled' })
        .eq('student_id', studentId);
      
      if (slipError) throw slipError;
      
      // Remove student from trip
      const { error: studentError } = await supabase
        .from('students')
        .update({ invitation_id: null })
        .eq('id', studentId);
      
      if (studentError) throw studentError;
      
      toast.success('Student removed from trip');
      fetchTripAndStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };
  
  const downloadCSVTemplate = () => {
    const csvContent = 'first_name,last_name,grade\nJohn,Doe,5th\nJane,Smith,6th';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_roster_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roster...</p>
        </div>
      </div>
    );
  }
  
  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Trip not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-2 border-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold font-display">Student Roster</h1>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto p-8">
        {/* Trip Info */}
        <Card className="border-2 border-black shadow-offset mb-6">
          <CardHeader>
            <CardTitle>{trip.experience?.title}</CardTitle>
            <p className="text-sm text-gray-600">{trip.experience?.venue?.name}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="font-semibold">{students.length} Students</span>
              </div>
              <div className="text-sm text-gray-600">
                Cost per student: ${((trip.experience?.cost_cents || 0) / 100).toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-10 border-2 border-black"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/trips/${tripId}/slips`)}
              className="border-2 border-black"
            >
              Track Permission Slips
            </Button>
            <Button
              variant="outline"
              onClick={downloadCSVTemplate}
              className="border-2 border-black"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV Template
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCSVModal(true)}
              className="border-2 border-black"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="shadow-offset"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
        
        {/* Student List */}
        <Card className="border-2 border-black shadow-offset">
          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery ? 'No students found matching your search' : 'No students in this trip yet'}
                </p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Student
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-black">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Permission Slip Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const status = getPermissionSlipStatus(student);
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{student.grade}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 text-${status.color}-600`} />
                              <span className={`text-sm font-medium text-${status.color}-600`}>
                                {status.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingStudent(student)}
                                className="border-2 border-black"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveStudent(student.id)}
                                className="border-2 border-red-500 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Add/Edit Student Modal */}
      {showAddModal && (
        <AddStudentModal
          tripId={tripId!}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTripAndStudents();
          }}
        />
      )}
      
      {showCSVModal && (
        <CSVImportModal
          tripId={tripId!}
          onClose={() => setShowCSVModal(false)}
          onSuccess={() => {
            setShowCSVModal(false);
            fetchTripAndStudents();
          }}
        />
      )}
      
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            fetchTripAndStudents();
          }}
        />
      )}
    </div>
  );
}
