import { useState } from 'react';
import { Button } from '@tripslip/ui';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { X, Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import Papa from 'papaparse';

interface CSVRow {
  first_name: string;
  last_name: string;
  grade: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: number;
  errors: ValidationError[];
  duplicates: string[];
}

interface CSVImportModalProps {
  tripId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVImportModal({ tripId, onClose, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  const validateCSVRow = (row: CSVRow, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Required fields
    if (!row.first_name || row.first_name.trim() === '') {
      errors.push({ row: index, field: 'first_name', message: 'First name is required' });
    }
    if (!row.last_name || row.last_name.trim() === '') {
      errors.push({ row: index, field: 'last_name', message: 'Last name is required' });
    }
    if (!row.grade || row.grade.trim() === '') {
      errors.push({ row: index, field: 'grade', message: 'Grade is required' });
    }
    
    return errors;
  };
  
  const processCSV = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve) => {
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const errors: ValidationError[] = [];
          const duplicates: string[] = [];
          const validRows: CSVRow[] = [];
          
          // Validate each row
          results.data.forEach((row, index) => {
            const rowErrors = validateCSVRow(row, index + 2); // +2 for header and 0-index
            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
            } else {
              validRows.push(row);
            }
          });
          
          // Check for duplicates within CSV
          const nameMap = new Map<string, number>();
          validRows.forEach((row, index) => {
            const fullName = `${row.first_name.trim()} ${row.last_name.trim()}`.toLowerCase();
            if (nameMap.has(fullName)) {
              duplicates.push(
                `Row ${index + 2}: ${row.first_name} ${row.last_name} appears multiple times in CSV`
              );
            } else {
              nameMap.set(fullName, index + 2);
            }
          });
          
          // Check for existing students in this trip (via permission slips)
          const { data: existingSlips } = await supabase
            .from('permission_slips')
            .select(`
              student:students (
                first_name,
                last_name
              )
            `)
            .eq('trip_id', tripId);
          
          const existingNames = new Set(
            (existingSlips || []).map((slip: any) => 
              `${slip.student?.first_name} ${slip.student?.last_name}`.toLowerCase()
            )
          );
          
          validRows.forEach((row, index) => {
            const fullName = `${row.first_name.trim()} ${row.last_name.trim()}`.toLowerCase();
            if (existingNames.has(fullName)) {
              duplicates.push(
                `Row ${index + 2}: ${row.first_name} ${row.last_name} already exists in trip roster`
              );
            }
          });
          
          // Insert valid rows if no errors or duplicates
          let successCount = 0;
          if (errors.length === 0 && duplicates.length === 0) {
            for (const row of validRows) {
              try {
                // Get current user (teacher)
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');
                
                // Get teacher record
                const { data: teacher, error: teacherError } = await supabase
                  .from('teachers')
                  .select('id')
                  .eq('user_id', user.id)
                  .single();
                
                if (teacherError) throw teacherError;
                
                // Get or create a default roster for this teacher
                let { data: roster, error: rosterError } = await supabase
                  .from('rosters')
                  .select('id')
                  .eq('teacher_id', teacher.id)
                  .eq('name', 'Default Roster')
                  .single();
                
                if (rosterError && rosterError.code === 'PGRST116') {
                  // Roster doesn't exist, create it
                  const { data: newRoster, error: createRosterError } = await supabase
                    .from('rosters')
                    .insert({
                      teacher_id: teacher.id,
                      name: 'Default Roster',
                      grade_level: row.grade.trim()
                    })
                    .select()
                    .single();
                  
                  if (createRosterError) throw createRosterError;
                  roster = newRoster;
                } else if (rosterError) {
                  throw rosterError;
                }
                
                // Create student
                const { data: student, error: studentError } = await supabase
                  .from('students')
                  .insert({
                    first_name: row.first_name.trim(),
                    last_name: row.last_name.trim(),
                    grade: row.grade.trim(),
                    roster_id: roster!.id,
                  })
                  .select()
                  .single();
                
                if (studentError) throw studentError;
                
                // Create permission slip for this trip
                const { error: slipError } = await supabase
                  .from('permission_slips')
                  .insert({
                    student_id: student.id,
                    trip_id: tripId,
                    status: 'pending',
                    magic_link_token: crypto.randomUUID(),
                  });
                
                if (slipError) throw slipError;
                
                successCount++;
              } catch (err: any) {
                errors.push({
                  row: validRows.indexOf(row) + 2,
                  field: 'general',
                  message: err.message || 'Failed to create student'
                });
              }
            }
          }
          
          resolve({ success: successCount, errors, duplicates });
        },
        error: (error) => {
          resolve({
            success: 0,
            errors: [{ row: 0, field: 'file', message: `CSV parsing error: ${error.message}` }],
            duplicates: []
          });
        }
      });
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    
    setProcessing(true);
    try {
      const importResult = await processCSV(file);
      setResult(importResult);
      
      if (importResult.success > 0) {
        toast.success(`Successfully imported ${importResult.success} students`);
        if (importResult.errors.length === 0 && importResult.duplicates.length === 0) {
          // Auto-close if completely successful
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else if (importResult.errors.length > 0 || importResult.duplicates.length > 0) {
        toast.error('Import completed with errors. Please review below.');
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV file');
    } finally {
      setProcessing(false);
    }
  };
  
  const downloadTemplate = () => {
    const csvContent = 'first_name,last_name,grade\nJohn,Doe,5th\nJane,Smith,6th';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_roster_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border-2 border-black shadow-offset max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b-2 border-black sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Import Students from CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* CSV Template Download */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">CSV Format</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Your CSV file must have these columns: first_name, last_name, grade
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>
          
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-2 file:border-black file:text-sm file:font-semibold file:bg-white hover:file:bg-gray-50"
              />
              {file && (
                <span className="text-sm text-gray-600">
                  {file.name}
                </span>
              )}
            </div>
          </div>
          
          {/* Import Results */}
          {result && (
            <div className="space-y-4">
              {/* Success Message */}
              {result.success > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">
                      Successfully imported {result.success} student{result.success !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Validation Errors */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Validation Errors ({result.errors.length})
                      </h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-800">
                            <span className="font-medium">Row {error.row}:</span>{' '}
                            {error.field !== 'general' && (
                              <span className="font-medium">{error.field} - </span>
                            )}
                            {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Duplicate Errors */}
              {result.duplicates.length > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900 mb-2">
                        Duplicate Students ({result.duplicates.length})
                      </h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {result.duplicates.map((duplicate, index) => (
                          <div key={index} className="text-sm text-yellow-800">
                            {duplicate}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t-2 border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-black"
            >
              {result && result.success > 0 ? 'Done' : 'Cancel'}
            </Button>
            {(!result || (result.errors.length > 0 || result.duplicates.length > 0)) && (
              <Button
                onClick={handleImport}
                disabled={!file || processing}
                className="shadow-offset"
              >
                <Upload className="h-4 w-4 mr-2" />
                {processing ? 'Importing...' : 'Import Students'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
