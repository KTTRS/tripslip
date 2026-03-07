import { useState, useEffect } from 'react';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Checkbox } from '@tripslip/ui/components/checkbox';
import { Card, CardContent } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { toast } from 'sonner';
import { Users, Search, UserCheck, UserX } from 'lucide-react';

interface StudentRow {
  id: string;
  roster_id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  date_of_birth: string | null;
  medical_info: any;
  created_at: string;
  updated_at: string;
}

export function StudentSelectionStep() {
  const { selectedStudents, setSelectedStudents, nextStep, prevStep } = useTripCreationStore();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedStudents.map(s => s.id))
  );

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      let studentData: StudentRow[] = [];

      if (user) {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (teacher) {
          const { data: rosters } = await supabase
            .from('rosters')
            .select('id')
            .eq('teacher_id', teacher.id);

          if (rosters && rosters.length > 0) {
            const rosterIds = rosters.map(r => r.id);
            const { data, error } = await supabase
              .from('students')
              .select('*')
              .in('roster_id', rosterIds)
              .order('last_name', { ascending: true });

            if (!error && data && data.length > 0) {
              studentData = data;
            }
          }
        }
      }

      if (studentData.length === 0 && user) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('last_name', { ascending: true })
          .limit(30);

        if (!error && data) {
          studentData = data;
        }
      }

      setStudents(studentData);
      setFilteredStudents(studentData);
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
      (student.grade && student.grade.toLowerCase().includes(query))
    );

    setFilteredStudents(filtered);
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    const selected = students.filter(s => selectedIds.has(s.id));
    setSelectedStudents(selected as any);
    nextStep();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-[#0A0A0A] bg-[#FFFDE7]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#F5C518] border-2 border-[#0A0A0A] flex items-center justify-center">
              <Users className="h-6 w-6 text-[#0A0A0A]" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Students Selected</p>
              <p className="text-3xl font-bold text-[#0A0A0A]">
                {selectedIds.size}
                <span className="text-lg text-gray-500 font-normal"> / {students.length}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or grade..."
            className="pl-10 border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleSelectAll}
          className="border-2 border-[#0A0A0A] hover:bg-[#FFFDE7] whitespace-nowrap"
        >
          {selectedIds.size === filteredStudents.length ? (
            <><UserX className="h-4 w-4 mr-1.5" /> Deselect All</>
          ) : (
            <><UserCheck className="h-4 w-4 mr-1.5" /> Select All</>
          )}
        </Button>
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto border-2 border-[#0A0A0A] rounded-lg p-3">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              {searchQuery ? 'No students found matching your search' : 'No students available'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isChecked = selectedIds.has(student.id);
            return (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  isChecked ? 'bg-[#FFFDE7] border border-[#F5C518]' : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => handleToggleStudent(student.id)}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleToggleStudent(student.id)}
                  className="border-2 border-[#0A0A0A] data-[state=checked]:bg-[#F5C518] data-[state=checked]:text-[#0A0A0A]"
                />
                <div className="flex-1">
                  <p className="font-medium text-[#0A0A0A]">
                    {student.first_name} {student.last_name}
                  </p>
                </div>
                {student.grade && (
                  <Badge variant="outline" className="border-[#0A0A0A] text-xs">
                    {student.grade}
                  </Badge>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          className="border-2 border-[#0A0A0A] hover:bg-gray-100"
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedIds.size === 0}
          className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 font-semibold disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
        >
          Next: Review & Submit ({selectedIds.size} selected)
        </Button>
      </div>
    </div>
  );
}
