import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

/**
 * CSV Service for roster import/export functionality
 * 
 * This service provides robust CSV parsing, validation, import, and export
 * capabilities for student rosters in the teacher app.
 * 
 * Features:
 * - Parse CSV files with validation
 * - Import students with parent information
 * - Export roster data with permission slip and payment status
 * - Generate CSV templates for import
 * - Comprehensive error handling and duplicate detection
 * 
 * Usage:
 * 
 * Import:
 * ```typescript
 * import { importRosterFromCSV } from '../services/csv-service';
 * 
 * const result = await importRosterFromCSV(file, tripId);
 * if (result.success > 0) {
 *   logger.info(`Imported ${result.success} students`);
 * }
 * ```
 * 
 * Export:
 * ```typescript
 * import { exportRosterToCSV, downloadCSV } from '../services/csv-service';
 * 
 * const blob = await exportRosterToCSV(tripId);
 * downloadCSV(blob, 'roster-export.csv');
 * ```
 * 
 * Template:
 * ```typescript
 * import { downloadCSVTemplate } from '../services/csv-service';
 * 
 * downloadCSVTemplate();
 * ```
 */

// =====================================================
// TYPES
// =====================================================

export interface CSVStudentRow {
  first_name: string;
  last_name: string;
  grade: string;
  date_of_birth?: string;
  parent_first_name?: string;
  parent_last_name?: string;
  parent_email?: string;
  parent_phone?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: number;
  errors: ValidationError[];
  duplicates: string[];
}

export interface ExportStudent {
  first_name: string;
  last_name: string;
  grade: string;
  date_of_birth?: string;
  permission_slip_status?: string;
  payment_status?: string;
  parent_email?: string;
  parent_phone?: string;
}

// =====================================================
// VALIDATION
// =====================================================

/**
 * Validates a single CSV row for required fields and format
 */
export function validateCSVRow(row: CSVStudentRow, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!row.first_name || row.first_name.trim() === '') {
    errors.push({ 
      row: index, 
      field: 'first_name', 
      message: 'First name is required' 
    });
  }
  
  if (!row.last_name || row.last_name.trim() === '') {
    errors.push({ 
      row: index, 
      field: 'last_name', 
      message: 'Last name is required' 
    });
  }
  
  if (!row.grade || row.grade.trim() === '') {
    errors.push({ 
      row: index, 
      field: 'grade', 
      message: 'Grade is required' 
    });
  }
  
  // Optional date of birth validation
  if (row.date_of_birth && row.date_of_birth.trim() !== '') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.date_of_birth)) {
      errors.push({
        row: index,
        field: 'date_of_birth',
        message: 'Date of birth must be in YYYY-MM-DD format'
      });
    }
  }
  
  // Optional email validation
  if (row.parent_email && row.parent_email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.parent_email)) {
      errors.push({
        row: index,
        field: 'parent_email',
        message: 'Invalid email format'
      });
    }
  }
  
  // Optional phone validation (basic)
  if (row.parent_phone && row.parent_phone.trim() !== '') {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(row.parent_phone)) {
      errors.push({
        row: index,
        field: 'parent_phone',
        message: 'Invalid phone format'
      });
    }
  }
  
  return errors;
}

// =====================================================
// CSV PARSING
// =====================================================

/**
 * Parses a CSV file and returns validated rows
 */
export async function parseCSV(file: File): Promise<{
  data: CSVStudentRow[];
  errors: ValidationError[];
}> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVStudentRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
      complete: (results) => {
        const errors: ValidationError[] = [];
        const validRows: CSVStudentRow[] = [];
        
        // Validate each row
        results.data.forEach((row, index) => {
          const rowErrors = validateCSVRow(row, index + 2); // +2 for header and 0-index
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else {
            validRows.push(row);
          }
        });
        
        resolve({ data: validRows, errors });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

// =====================================================
// CSV IMPORT
// =====================================================

/**
 * Imports students from CSV file into a trip roster
 */
export async function importRosterFromCSV(
  file: File,
  tripId: string
): Promise<ImportResult> {
  try {
    // Parse CSV
    const { data: validRows, errors } = await parseCSV(file);
    
    if (errors.length > 0) {
      return { success: 0, errors, duplicates: [] };
    }
    
    // Check for duplicates within CSV
    const duplicates: string[] = [];
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
    
    // Check for existing students in trip
    const { data: existingStudents } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('invitation_id', tripId);
    
    const existingNames = new Set(
      (existingStudents || []).map((s: any) => 
        `${s.first_name} ${s.last_name}`.toLowerCase()
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
    
    // If there are duplicates, return without importing
    if (duplicates.length > 0) {
      return { success: 0, errors: [], duplicates };
    }
    
    // Import valid rows
    let successCount = 0;
    const importErrors: ValidationError[] = [];
    
    for (const row of validRows) {
      try {
        // Create student
        const studentData: any = {
          first_name: row.first_name.trim(),
          last_name: row.last_name.trim(),
          grade: row.grade.trim(),
          invitation_id: tripId,
        };
        
        if (row.date_of_birth && row.date_of_birth.trim() !== '') {
          studentData.date_of_birth = row.date_of_birth.trim();
        }
        
        const { data: student, error: studentError } = await supabase
          .from('students')
          .insert(studentData)
          .select()
          .single();
        
        if (studentError) throw studentError;
        
        // Create permission slip
        const { error: slipError } = await supabase
          .from('permission_slips')
          .insert({
            student_id: (student as any)!.id,
            invitation_id: tripId,
            status: 'pending',
            token: crypto.randomUUID(),
          } as any);
        
        if (slipError) throw slipError;
        
        // Create parent if parent info provided
        if (row.parent_email && row.parent_email.trim() !== '') {
          const parentData: any = {
            first_name: row.parent_first_name?.trim() || '',
            last_name: row.parent_last_name?.trim() || '',
            email: row.parent_email.trim(),
            phone: row.parent_phone?.trim() || '',
          };
          
          const { data: parent, error: parentError } = await supabase
            .from('parents')
            .insert(parentData)
            .select()
            .single();
          
          if (!parentError && parent) {
            // Link parent to student
            await supabase
              .from('student_parents')
              .insert({
                student_id: (student as any)!.id,
                parent_id: (parent as any).id,
                relationship: 'parent',
                primary_contact: true,
              } as any);
          }
        }
        
        successCount++;
      } catch (err: any) {
        importErrors.push({
          row: validRows.indexOf(row) + 2,
          field: 'general',
          message: err.message || 'Failed to create student'
        });
      }
    }
    
    return { success: successCount, errors: importErrors, duplicates: [] };
  } catch (error: any) {
    return {
      success: 0,
      errors: [{ row: 0, field: 'file', message: error.message }],
      duplicates: []
    };
  }
}

// =====================================================
// CSV EXPORT
// =====================================================

/**
 * Generates CSV content from student roster data
 */
export function generateCSV(students: ExportStudent[]): string {
  // Define headers
  const headers = [
    'first_name',
    'last_name',
    'grade',
    'date_of_birth',
    'permission_slip_status',
    'payment_status',
    'parent_email',
    'parent_phone'
  ];
  
  // Create CSV rows
  const rows = students.map(student => {
    return [
      student.first_name || '',
      student.last_name || '',
      student.grade || '',
      student.date_of_birth || '',
      student.permission_slip_status || '',
      student.payment_status || '',
      student.parent_email || '',
      student.parent_phone || ''
    ].map(field => {
      // Escape fields containing commas, quotes, or newlines
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    }).join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Exports trip roster data to CSV file
 */
export async function exportRosterToCSV(tripId: string): Promise<Blob> {
  try {
    // Fetch students with related data
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        first_name,
        last_name,
        grade,
        date_of_birth,
        permission_slips (
          status,
          payments (
            status
          )
        ),
        student_parents (
          parents (
            email,
            phone
          )
        )
      `)
      .eq('invitation_id', tripId)
      .order('last_name', { ascending: true });
    
    if (error) throw error;
    
    // Transform data for export
    const exportData: ExportStudent[] = (students || []).map((student: any) => {
      const permissionSlip = student.permission_slips?.[0];
      const payment = permissionSlip?.payments?.[0];
      const parent = student.student_parents?.[0]?.parents;
      
      return {
        first_name: student.first_name,
        last_name: student.last_name,
        grade: student.grade,
        date_of_birth: student.date_of_birth || '',
        permission_slip_status: permissionSlip?.status || 'pending',
        payment_status: payment?.status || 'unpaid',
        parent_email: parent?.email || '',
        parent_phone: parent?.phone || ''
      };
    });
    
    // Generate CSV content
    const csvContent = generateCSV(exportData);
    
    // Create blob
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  } catch (error: any) {
    throw new Error(`Failed to export roster: ${error.message}`);
  }
}

/**
 * Downloads CSV file to user's device
 */
export function downloadCSV(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a CSV template for roster import
 */
export function downloadCSVTemplate(): void {
  const headers = [
    'first_name',
    'last_name',
    'grade',
    'date_of_birth',
    'parent_first_name',
    'parent_last_name',
    'parent_email',
    'parent_phone'
  ];
  
  const exampleRows = [
    ['John', 'Doe', '5th', '2015-03-15', 'Jane', 'Doe', 'jane.doe@example.com', '555-0100'],
    ['Sarah', 'Smith', '6th', '2014-07-22', 'Mike', 'Smith', 'mike.smith@example.com', '555-0101']
  ];
  
  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadCSV(blob, 'student_roster_template.csv');
}
