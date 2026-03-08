import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, Button, Input } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { toast } from 'sonner';
import {
  Plus,
  Upload,
  Download,
  Edit2,
  Trash2,
  Search,
  Users,
  Phone,
  Mail,
  Link2,
  Copy,
  Check,
  Send,
  UserPlus,
} from 'lucide-react';
import { AddStudentModal } from '../components/roster/AddStudentModal';
import { EditStudentModal } from '../components/roster/EditStudentModal';
import { CSVImportModal } from '../components/roster/CSVImportModal';
import { SendLinksModal } from '../components/roster/SendLinksModal';

interface ParentInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  relationship?: string;
}

interface StudentWithParent {
  id: string;
  first_name: string;
  last_name: string;
  grade: string;
  date_of_birth: string | null;
  medical_info: any;
  roster_id: string;
  created_at: string;
  updated_at: string;
  parents: ParentInfo[];
  tripCount?: number;
}

interface RosterInfo {
  id: string;
  name: string;
  grade_level: string;
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const { teacher } = useAuth();

  const [students, setStudents] = useState<StudentWithParent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithParent[]>([]);
  const [rosters, setRosters] = useState<RosterInfo[]>([]);
  const [selectedRoster, setSelectedRoster] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showSendLinksModal, setShowSendLinksModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const fetchStudents = useCallback(async () => {
    if (!teacher) return;

    try {
      setLoading(true);

      const { data: rosterData } = await supabase
        .from('rosters')
        .select('id, name, grade_level')
        .eq('teacher_id', teacher.id)
        .order('name');

      setRosters(rosterData || []);

      if (!rosterData || rosterData.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        setLoading(false);
        return;
      }

      const rosterIds = rosterData.map((r) => r.id);

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .in('roster_id', rosterIds)
        .order('last_name');

      if (studentsError) throw studentsError;

      const studentIds = (studentsData || []).map((s) => s.id);

      let parentMap: Record<string, ParentInfo[]> = {};

      if (studentIds.length > 0) {
        const { data: spData } = await supabase
          .from('student_parents')
          .select('student_id, relationship, parent:parents(id, first_name, last_name, email, phone)')
          .in('student_id', studentIds);

        if (spData) {
          for (const sp of spData) {
            const sid = sp.student_id;
            if (!parentMap[sid]) parentMap[sid] = [];
            if (sp.parent) {
              const p = sp.parent as any;
              parentMap[sid].push({
                id: p.id,
                first_name: p.first_name,
                last_name: p.last_name,
                email: p.email,
                phone: p.phone,
                relationship: sp.relationship || undefined,
              });
            }
          }
        }
      }

      const enriched: StudentWithParent[] = (studentsData || []).map((s) => ({
        ...s,
        parents: parentMap[s.id] || [],
      }));

      setStudents(enriched);
      setFilteredStudents(enriched);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [teacher]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let filtered = students;

    if (selectedRoster !== 'all') {
      filtered = filtered.filter((s) => s.roster_id === selectedRoster);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.grade.toLowerCase().includes(q) ||
          s.parents.some(
            (p) =>
              p.first_name?.toLowerCase().includes(q) ||
              p.last_name?.toLowerCase().includes(q) ||
              p.email?.toLowerCase().includes(q)
          )
      );
    }

    setFilteredStudents(filtered);
  }, [searchQuery, students, selectedRoster]);

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Remove this student from your roster? This cannot be undone.')) return;

    try {
      await supabase.from('permission_slips').delete().eq('student_id', studentId);
      await supabase.from('student_parents').delete().eq('student_id', studentId);
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
      toast.success('Student removed');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to remove student');
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedStudents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudents(next);
  };

  const downloadCSVTemplate = () => {
    const csvContent =
      'first_name,last_name,grade,date_of_birth,parent_first_name,parent_last_name,parent_email,parent_phone\nJohn,Doe,5th,2015-03-15,Jane,Doe,jane.doe@email.com,(555) 123-4567\nEmma,Smith,5th,,Mike,Smith,mike.smith@email.com,(555) 987-6543';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_roster_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportStudentsCSV = () => {
    const rows = filteredStudents.map((s) => {
      const parent = s.parents[0];
      return {
        first_name: s.first_name,
        last_name: s.last_name,
        grade: s.grade,
        date_of_birth: s.date_of_birth || '',
        parent_first_name: parent?.first_name || '',
        parent_last_name: parent?.last_name || '',
        parent_email: parent?.email || '',
        parent_phone: parent?.phone || '',
      };
    });

    const headers = Object.keys(rows[0] || {}).join(',');
    const csvRows = rows.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const selectedStudentsList = students.filter((s) => selectedStudents.has(s.id));

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0A0A0A]">Students</h1>
            <p className="text-gray-600 mt-1">
              {students.length} student{students.length !== 1 ? 's' : ''} across {rosters.length} roster{rosters.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={downloadCSVTemplate}
              className="border-2 border-[#0A0A0A] text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Template
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCSVModal(true)}
              className="border-2 border-[#0A0A0A] text-sm"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import CSV
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all text-sm font-semibold"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Student
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students, parents, emails..."
              className="pl-10 border-2 border-[#0A0A0A]"
            />
          </div>
          <select
            value={selectedRoster}
            onChange={(e) => setSelectedRoster(e.target.value)}
            className="border-2 border-[#0A0A0A] rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Rosters</option>
            {rosters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.grade_level})
              </option>
            ))}
          </select>
          {filteredStudents.length > 0 && (
            <Button
              variant="outline"
              onClick={exportStudentsCSV}
              className="border-2 border-[#0A0A0A] text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>

        {selectedStudents.size > 0 && (
          <div className="bg-[#F5C518]/20 border-2 border-[#F5C518] rounded-lg p-3 flex items-center justify-between">
            <span className="font-medium text-sm">
              {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowSendLinksModal(true)}
                className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-sm font-semibold"
              >
                <Send className="h-3 w-3 mr-1" />
                Send Permission Slip Links
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudents(new Set())}
                className="border-2 border-[#0A0A0A] text-sm"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 ? (
          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
            <CardContent className="py-16">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                {students.length === 0 ? (
                  <>
                    <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">No students yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Add your students one by one or upload a CSV with your full class roster including parent contact info.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowCSVModal(true)}
                        className="border-2 border-[#0A0A0A]"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import from CSV
                      </Button>
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-[#0A0A0A] mb-1">No results</h3>
                    <p className="text-gray-500">No students match your search or filter.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0A0A0A] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-white"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                        Parent / Guardian
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredStudents.map((student, index) => {
                      const parent = student.parents[0];
                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-[#F5C518]/10 transition-colors duration-150 ${
                            selectedStudents.has(student.id) ? 'bg-[#F5C518]/15' : index % 2 === 1 ? 'bg-gray-50/60' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.id)}
                              onChange={() => toggleSelect(student.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#0A0A0A]">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-xs text-gray-500 sm:hidden">Grade {student.grade}</div>
                            {student.medical_info && Object.keys(student.medical_info).length > 0 && (
                              <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                Medical info
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-sm text-gray-700">{student.grade}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {parent ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {parent.first_name} {parent.last_name}
                                </div>
                                {parent.relationship && (
                                  <div className="text-xs text-gray-500">{parent.relationship}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                No parent info
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {parent ? (
                              <div className="space-y-1">
                                {parent.email && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[180px]">{parent.email}</span>
                                  </div>
                                )}
                                {parent.phone && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Phone className="h-3 w-3" />
                                    {parent.phone}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setEditingStudent(student)}
                                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-[#0A0A0A] hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit student"
                                aria-label={`Edit ${student.first_name} ${student.last_name}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove student"
                                aria-label={`Remove ${student.first_name} ${student.last_name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchStudents();
          }}
        />
      )}

      {showCSVModal && (
        <CSVImportModal
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

      {showSendLinksModal && (
        <SendLinksModal
          students={selectedStudentsList}
          onClose={() => setShowSendLinksModal(false)}
          onSuccess={() => {
            setShowSendLinksModal(false);
            setSelectedStudents(new Set());
          }}
        />
      )}
    </Layout>
  );
}
