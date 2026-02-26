import { useState, useEffect } from 'react';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { createSupabaseClient } from '@tripslip/database';
import type { Tables } from '@tripslip/database';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Checkbox } from '@tripslip/ui/components/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { toast } from 'sonner';
import { Upload, Users, DollarSign, Search } from 'lucide-react';

type Student = Tables<'students'>;

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
      
      setStudents(data || []);
      setFilteredStudents(data || []);
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
  
  const handleCSVImport = () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const lines = text.split('\n');
        
        // Skip header row
        const dataLines = lines.slice(1).filter(line => line.trim());
        
        const importedStudents: Array<{
          first_name: string;
          last_name: string;
          grade: string;
          invitation_id: null;
        }> = [];
        const errors: string[] = [];
        
        dataLines.forEach((line, index) => {
          const [firstName, lastName, grade] = line.split(',').map(s => s.trim());
          
          if (!firstName || !lastName || !grade) {
            errors.push(`Row ${index + 2}: Missing required fields`);
            return;
          }
          
          importedStudents.push({
            first_name: firstName,
            last_name: lastName,
            grade: grade,
            invitation_id: null,
          });
        });
        
        if (errors.length > 0) {
          toast.error(`CSV import errors:\n${errors.join('\n')}`);
          return;
        }
        
        // Insert students into database
        const { data, error } = await supabase
          .from('students')
          .insert(importedStudents)
          .select();
        
        if (error) throw error;
        
        // Add to students list and select them
        if (data) {
          setStudents((prev) => [...prev, ...data]);
          setSelectedIds((prev) => {
            const newSet = new Set(prev);
            data.forEach(s => newSet.add(s.id));
            return newSet;
          });
          toast.success(`Successfully imported ${data.length} students`);
        }
      } catch (error) {
        console.error('Error importing CSV:', error);
        toast.error('Failed to import CSV file');
      }
    };
    
    input.click();
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
        
        <Button
          type="button"
          variant="outline"
          onClick={handleCSVImport}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </div>
      
      {/* Student List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchQuery ? 'No students found matching your search' : 'No students available'}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleCSVImport}
              className="mt-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Students from CSV
            </Button>
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
      
      {/* CSV Format Help */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">CSV Import Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            Your CSV file should have the following columns (with header row):
          </p>
          <code className="block bg-white p-2 rounded text-xs">
            first_name,last_name,grade<br />
            John,Doe,5th<br />
            Jane,Smith,6th
          </code>
        </CardContent>
      </Card>
      
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
