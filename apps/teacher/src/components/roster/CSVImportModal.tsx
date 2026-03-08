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
  date_of_birth?: string;
  parent_first_name?: string;
  parent_last_name?: string;
  parent_email?: string;
  parent_phone?: string;
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
  tripId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVImportModal({ tripId, onClose, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validateCSVRow = (row: CSVRow, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
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

          results.data.forEach((row, index) => {
            const rowErrors = validateCSVRow(row, index + 2);
            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
            } else {
              validRows.push(row);
            }
          });

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

          let successCount = 0;
          if (errors.length === 0 && duplicates.length === 0) {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) throw new Error('Not authenticated');

              const { data: teacher, error: teacherError } = await supabase
                .from('teachers')
                .select('id')
                .eq('user_id', user.id)
                .single();
              if (teacherError) throw teacherError;

              let { data: roster, error: rosterError } = await supabase
                .from('rosters')
                .select('id')
                .eq('teacher_id', teacher.id)
                .eq('name', 'Default Roster')
                .single();

              if (rosterError && rosterError.code === 'PGRST116') {
                const { data: newRoster, error: createRosterError } = await supabase
                  .from('rosters')
                  .insert({
                    teacher_id: teacher.id,
                    name: 'Default Roster',
                    grade_level: validRows[0]?.grade.trim() || 'Mixed',
                  })
                  .select()
                  .single();
                if (createRosterError) throw createRosterError;
                roster = newRoster;
              } else if (rosterError) {
                throw rosterError;
              }

              const { data: existingStudents } = await supabase
                .from('students')
                .select('first_name, last_name')
                .eq('roster_id', roster!.id);

              const existingNames = new Set(
                (existingStudents || []).map(
                  (s) => `${s.first_name} ${s.last_name}`.toLowerCase()
                )
              );

              for (const row of validRows) {
                const fullName = `${row.first_name.trim()} ${row.last_name.trim()}`.toLowerCase();
                if (existingNames.has(fullName)) {
                  duplicates.push(`${row.first_name} ${row.last_name} already exists in your roster`);
                  continue;
                }

                try {
                  const { data: student, error: studentError } = await supabase
                    .from('students')
                    .insert({
                      first_name: row.first_name.trim(),
                      last_name: row.last_name.trim(),
                      grade: row.grade.trim(),
                      date_of_birth: row.date_of_birth?.trim() || null,
                      roster_id: roster!.id,
                    })
                    .select()
                    .single();

                  if (studentError) throw studentError;

                  if (row.parent_first_name?.trim() && row.parent_last_name?.trim()) {
                    const { data: parent } = await supabase
                      .from('parents')
                      .insert({
                        first_name: row.parent_first_name.trim(),
                        last_name: row.parent_last_name.trim(),
                        email: row.parent_email?.trim() || null,
                        phone: row.parent_phone?.trim() || null,
                      })
                      .select()
                      .single();

                    if (parent) {
                      await supabase.from('student_parents').insert({
                        student_id: student.id,
                        parent_id: parent.id,
                        relationship: 'Parent',
                        primary_contact: true,
                      });
                    }
                  }

                  if (tripId) {
                    await supabase.from('permission_slips').insert({
                      student_id: student.id,
                      trip_id: tripId,
                      status: 'pending',
                      magic_link_token: crypto.randomUUID(),
                    });
                  }

                  successCount++;
                  existingNames.add(fullName);
                } catch (err: any) {
                  errors.push({
                    row: validRows.indexOf(row) + 2,
                    field: 'general',
                    message: err.message || 'Failed to create student',
                  });
                }
              }
            } catch (err: any) {
              errors.push({
                row: 0,
                field: 'general',
                message: err.message || 'Authentication error',
              });
            }
          }

          resolve({ success: successCount, errors, duplicates });
        },
        error: (error) => {
          resolve({
            success: 0,
            errors: [{ row: 0, field: 'file', message: `CSV parsing error: ${error.message}` }],
            duplicates: [],
          });
        },
      });
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
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
        const skippedCount = importResult.duplicates.length + importResult.errors.length;
        const successMsg = `${importResult.success} student${importResult.success !== 1 ? 's' : ''} imported`;
        const skippedMsg = skippedCount > 0 ? `, ${skippedCount} skipped` : '';
        toast.success(`${successMsg}${skippedMsg}`);
        if (importResult.errors.length === 0 && importResult.duplicates.length === 0) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else if (importResult.errors.length > 0 || importResult.duplicates.length > 0) {
        const totalSkipped = importResult.duplicates.length + importResult.errors.length;
        toast.error(`Import failed: ${totalSkipped} student${totalSkipped !== 1 ? 's' : ''} skipped. Review issues below.`);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV file');
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b-2 border-[#0A0A0A] sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-xl font-bold text-[#0A0A0A]">Import Students from CSV</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">CSV Format</h3>
                <p className="text-sm text-blue-800 mb-1">
                  Required: <code className="bg-blue-100 px-1 rounded">first_name</code>,{' '}
                  <code className="bg-blue-100 px-1 rounded">last_name</code>,{' '}
                  <code className="bg-blue-100 px-1 rounded">grade</code>
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  Optional: <code className="bg-blue-100 px-1 rounded">date_of_birth</code>,{' '}
                  <code className="bg-blue-100 px-1 rounded">parent_first_name</code>,{' '}
                  <code className="bg-blue-100 px-1 rounded">parent_last_name</code>,{' '}
                  <code className="bg-blue-100 px-1 rounded">parent_email</code>,{' '}
                  <code className="bg-blue-100 px-1 rounded">parent_phone</code>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-2 file:border-[#0A0A0A] file:text-sm file:font-semibold file:bg-white hover:file:bg-gray-50"
              />
            </div>
          </div>

          {result && (
            <div className="space-y-3">
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

              {result.errors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Errors ({result.errors.length})
                      </h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-800">
                            {error.row > 0 && <span className="font-medium">Row {error.row}: </span>}
                            {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.duplicates.length > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900 mb-2">
                        Duplicates ({result.duplicates.length})
                      </h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {result.duplicates.map((dup, index) => (
                          <div key={index} className="text-sm text-yellow-800">
                            {dup}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="border-2 border-[#0A0A0A]">
              {result && result.success > 0 ? 'Done' : 'Cancel'}
            </Button>
            {(!result || result.errors.length > 0 || result.duplicates.length > 0) && (
              <Button
                onClick={handleImport}
                disabled={!file || processing}
                className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold"
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
