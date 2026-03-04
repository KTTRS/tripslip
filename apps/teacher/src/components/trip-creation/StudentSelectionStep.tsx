import { useState, useEffect } from 'react';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { supabase } from '../../lib/supabase';
import type { Tables } from '@tripslip/database';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Checkbox } from '@tripslip/ui/components/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { toast } from 'sonner';
import { Upload, Users, DollarSign, Search } from 'lucide-react';

type Student = Tables<'students'>;

const MOCK_STUDENTS: Student[] = [
  { id: 'stu-001', first_name: 'Emma', last_name: 'Johnson', grade: '5th', invitation_id: null, parent_email: 'emma.parent@example.com', parent_name: 'Sarah Johnson', parent_phone: '555-0101', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-002', first_name: 'Liam', last_name: 'Williams', grade: '5th', invitation_id: null, parent_email: 'liam.parent@example.com', parent_name: 'David Williams', parent_phone: '555-0102', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-003', first_name: 'Olivia', last_name: 'Brown', grade: '5th', invitation_id: null, parent_email: 'olivia.parent@example.com', parent_name: 'Jennifer Brown', parent_phone: '555-0103', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-004', first_name: 'Noah', last_name: 'Davis', grade: '5th', invitation_id: null, parent_email: 'noah.parent@example.com', parent_name: 'Michael Davis', parent_phone: '555-0104', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-005', first_name: 'Ava', last_name: 'Garcia', grade: '5th', invitation_id: null, parent_email: 'ava.parent@example.com', parent_name: 'Maria Garcia', parent_phone: '555-0105', preferred_language: 'es', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-006', first_name: 'Ethan', last_name: 'Martinez', grade: '6th', invitation_id: null, parent_email: 'ethan.parent@example.com', parent_name: 'Carlos Martinez', parent_phone: '555-0106', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-007', first_name: 'Sophia', last_name: 'Anderson', grade: '6th', invitation_id: null, parent_email: 'sophia.parent@example.com', parent_name: 'Lisa Anderson', parent_phone: '555-0107', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-008', first_name: 'Mason', last_name: 'Thomas', grade: '6th', invitation_id: null, parent_email: 'mason.parent@example.com', parent_name: 'Robert Thomas', parent_phone: '555-0108', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-009', first_name: 'Isabella', last_name: 'Taylor', grade: '5th', invitation_id: null, parent_email: 'isabella.parent@example.com', parent_name: 'Jessica Taylor', parent_phone: '555-0109', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-010', first_name: 'James', last_name: 'Wilson', grade: '6th', invitation_id: null, parent_email: 'james.parent@example.com', parent_name: 'Thomas Wilson', parent_phone: '555-0110', preferred_language: 'en', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
] as Student[];

export function StudentSelectionStep() {
  const { selectedStudents, selectedExperience, setSelectedStudents, nextStep, prevStep } = useTripCreationStore();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
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
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStudents(data);
        setFilteredStudents(data);
      } else {
        setStudents(MOCK_STUDENTS);
        setFilteredStudents(MOCK_STUDENTS);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents(MOCK_STUDENTS);
      setFilteredStudents(MOCK_STUDENTS);
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
    setSelectedStudents(selected);
    nextStep();
  };
  
  const calculateTotalCost = () => {
    if (!selectedExperience) return 0;
    return selectedIds.size * selectedExperience.cost_cents;
  };
  
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Students Selected</p>
                <p className="text-2xl font-bold text-gray-900">{selectedIds.size}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Cost per Student</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedExperience ? formatCurrency(selectedExperience.cost_cents) : '$0.00'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculateTotalCost())}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-10 w-64"
            />
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleSelectAll}
          >
            {selectedIds.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>
      
      {/* Student List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchQuery ? 'No students found matching your search' : 'No students available'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => handleToggleStudent(student.id)}
            >
              <Checkbox
                checked={selectedIds.has(student.id)}
                onCheckedChange={() => handleToggleStudent(student.id)}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {student.first_name} {student.last_name}
                </p>
                <p className="text-sm text-gray-600">Grade: {student.grade}</p>
              </div>
              <Badge variant="outline">{student.grade}</Badge>
            </div>
          ))
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
        >
          Back
        </Button>
        
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedIds.size === 0}
        >
          Next: Review & Submit
        </Button>
      </div>
    </div>
  );
}
