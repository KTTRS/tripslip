import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import type { Tables } from '@tripslip/database';
import { PermissionSlipService } from '@tripslip/database';
import { toast } from 'sonner';
import { 
  Plus, 
  Upload, 
  Download, 
  Edit2, 
  Trash2, 
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { AddStudentModal } from './roster/AddStudentModal';
import { EditStudentModal } from './roster/EditStudentModal';
import { CSVImportModal } from './roster/CSVImportModal';

type Student = Tables<'students'>;
type PermissionSlip = Tables<'permission_slips'>;

interface StudentWithSlip {
  id: string;
  roster_id: string;
  first_name: string;
  last_name: string;
  grade: string;
  date_of_birth: string | null;
  medical_info: any;
  created_at: string;
  updated_at: string;
  invitation_id?: string | null;
  permission_slip?: PermissionSlip & {
    payments?: Array<{ status: string; amount_cents: number }>;
  };
}

interface RosterManagerProps {
  tripId: string;
  onStudentCountChange?: (count: number) => void;
}

export function RosterManager({ tripId, onStudentCountChange }: RosterManagerProps) {
  const [students, setStudents] = useState<StudentWithSlip[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [generatingSlips, setGeneratingSlips] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  
  // Initialize permission slip service
  const permissionSlipService = new PermissionSlipService(supabase);
  
  useEffect(() => {
    if (tripId) {
      fetchStudents();
    }
  }, [tripId]);
  
  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);
  
  useEffect(() => {
    if (onStudentCountChange) {
      onStudentCountChange(students.length);
    }
  }, [students.length, onStudentCountChange]);
  
  const fetchStudents = async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      
      // Fetch students with permission slips for this specific trip
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          permission_slip:permission_slips!permission_slips_student_id_fkey (
            id,
            status,
            signed_at,
            trip_id,
            payments (
              status,
              amount_cents
            )
          )
        `)
        .eq('permission_slips.trip_id', tripId)
        .order('last_name', { ascending: true });
      
      if (studentsError) throw studentsError;
      
      // Transform data to handle single permission slip for this trip
      const transformedStudents = (studentsData || []).map((student: any) => ({
        ...student,
        permission_slip: Array.isArray(student.permission_slip) 
          ? student.permission_slip.find((slip: any) => slip.trip_id === tripId)
          : student.permission_slip
      }));
      
      setStudents(transformedStudents);
      setFilteredStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
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
    const hasPaidPayment = slip.payments?.some((p: any) => p.status === 'succeeded');
    
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
      // Mark permission slip as cancelled for this trip
      const { error: slipError } = await supabase
        .from('permission_slips')
        .update({ status: 'cancelled' } as any)
        .eq('student_id', studentId)
        .eq('trip_id', tripId);
      
      if (slipError) throw slipError;
      
      toast.success('Student removed from trip');
      fetchStudents();
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

  const handleExportCSV = async () => {
    if (!tripId) return;
    
    try {
      setExportingCSV(true);
      
      // Get students for this trip via permission slips
      const { data: permissionSlips, error } = await supabase
        .from('permission_slips')
        .select(`
          status,
          student:students (
            first_name,
            last_name,
            grade,
            date_of_birth
          ),
          payments (
            status
          )
        `)
        .eq('trip_id', tripId);
      
      if (error) throw error;
      
      // Transform data for CSV export
      const csvData = (permissionSlips || []).map((slip: any) => ({
        first_name: slip.student?.first_name || '',
        last_name: slip.student?.last_name || '',
        grade: slip.student?.grade || '',
        date_of_birth: slip.student?.date_of_birth || '',
        permission_slip_status: slip.status || 'pending',
        payment_status: slip.payments?.[0]?.status || 'unpaid'
      }));
      
      // Generate CSV content
      const headers = ['first_name', 'last_name', 'grade', 'date_of_birth', 'permission_slip_status', 'payment_status'];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => row[header as keyof typeof row] || '').join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `roster-export-${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Roster exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export roster');
    } finally {
      setExportingCSV(false);
    }
  };

  const handleGeneratePermissionSlips = async () => {
    if (!tripId) return;
    
    try {
      setGeneratingSlips(true);
      
      // For now, we'll work with the students that are already associated with this trip
      // In a complete implementation, there would be a way to select students from rosters
      // and add them to the trip before generating permission slips
      
      const studentIds = students.map(student => student.id);
      
      if (studentIds.length === 0) {
        toast.error('No students in roster to generate permission slips for');
        return;
      }
      
      const result = await permissionSlipService.generatePermissionSlips({
        tripId,
        studentIds
      });
      
      if (result.errors.length > 0) {
        toast.error(`Generated ${result.totalGenerated} slips with ${result.errors.length} errors`);
        console.error('Permission slip generation errors:', result.errors);
      } else {
        toast.success(`Successfully generated ${result.totalGenerated} permission slips`);
        if (result.totalSkipped > 0) {
          toast.info(`Skipped ${result.totalSkipped} students who already have permission slips`);
        }
      }
      
      // Refresh the student list to show updated permission slip statuses
      fetchStudents();
    } catch (error) {
      console.error('Error generating permission slips:', error);
      toast.error('Failed to generate permission slips');
    } finally {
      setGeneratingSlips(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roster...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
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
            onClick={downloadCSVTemplate}
            className="border-2 border-black"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV Template
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={exportingCSV || students.length === 0}
            className="border-2 border-black"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportingCSV ? 'Exporting...' : 'Export CSV'}
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
            variant="outline"
            onClick={handleGeneratePermissionSlips}
            disabled={generatingSlips || students.length === 0}
            className="border-2 border-green-600 text-green-700 hover:bg-green-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            {generatingSlips ? 'Generating...' : 'Generate Slips'}
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#F5C518] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>
      
      {/* Student List */}
      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {searchQuery ? 'No students found matching your search' : 'No students in this trip yet'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Add students individually or import from CSV
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#F5C518] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all"
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const status = getPermissionSlipStatus(student);
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 font-mono">{student.grade}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <StatusIcon 
                              className={`h-4 w-4 ${
                                status.color === 'green' ? 'text-green-600' :
                                status.color === 'blue' ? 'text-blue-600' :
                                status.color === 'red' ? 'text-red-600' :
                                'text-gray-600'
                              }`} 
                            />
                            <span 
                              className={`text-sm font-medium ${
                                status.color === 'green' ? 'text-green-600' :
                                status.color === 'blue' ? 'text-blue-600' :
                                status.color === 'red' ? 'text-red-600' :
                                'text-gray-600'
                              }`}
                            >
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
                              className="border-2 border-black hover:bg-gray-50"
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
      
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-mono font-semibold">{students.length} Total Students</span>
          </div>
          {searchQuery && (
            <div className="text-gray-500">
              Showing {filteredStudents.length} of {students.length}
            </div>
          )}
        </div>
        
        {/* Permission Slip Status Summary */}
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-mono">
            {students.filter(s => s.permission_slip?.status === 'signed' || 
                                  s.permission_slip?.payments?.some((p: any) => p.status === 'succeeded')).length} Signed/Paid
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-gray-600" />
          <span className="font-mono">
            {students.filter(s => !s.permission_slip || s.permission_slip.status === 'pending').length} Pending
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="font-mono">
            {students.filter(s => s.permission_slip?.status === 'cancelled').length} Cancelled
          </span>
        </div>
      </div>
      
      {/* Modals */}
      {showAddModal && (
        <AddStudentModal
          tripId={tripId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchStudents();
          }}
        />
      )}
      
      {showCSVModal && (
        <CSVImportModal
          tripId={tripId}
          onClose={() => setShowCSVModal(false)}
          onSuccess={() => {
            setShowCSVModal(false);
            fetchStudents();
          }}
        />
      )}
      
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}
