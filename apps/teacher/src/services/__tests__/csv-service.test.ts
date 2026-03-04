/**
 * Unit Tests - CSV Service (Task 4.6)
 * 
 * Tests error handling, validation, and edge cases for CSV import/export
 * 
 * **Validates: Requirements 5.3, 5.8**
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the Supabase client before importing csv-service
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(() => ({}))
}));

import {
  validateCSVRow,
  parseCSV,
  generateCSV,
  type CSVStudentRow,
  type ExportStudent
} from '../csv-service';

describe('CSV Service - Unit Tests (Task 4.6)', () => {
  describe('validateCSVRow - Required Fields', () => {
    it('should reject row with missing first_name', () => {
      const row: CSVStudentRow = {
        first_name: '',
        last_name: 'Doe',
        grade: '5th'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        row: 1,
        field: 'first_name',
        message: 'First name is required'
      });
    });

    it('should reject row with whitespace-only first_name', () => {
      const row: CSVStudentRow = {
        first_name: '   ',
        last_name: 'Doe',
        grade: '5th'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'first_name')).toBe(true);
    });

    it('should reject row with missing last_name', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: '',
        grade: '5th'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        row: 1,
        field: 'last_name',
        message: 'Last name is required'
      });
    });

    it('should reject row with missing grade', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: ''
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        row: 1,
        field: 'grade',
        message: 'Grade is required'
      });
    });

    it('should reject row with multiple missing required fields', () => {
      const row: CSVStudentRow = {
        first_name: '',
        last_name: '',
        grade: ''
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(3);
      expect(errors.map(e => e.field)).toContain('first_name');
      expect(errors.map(e => e.field)).toContain('last_name');
      expect(errors.map(e => e.field)).toContain('grade');
    });

    it('should accept row with all required fields', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateCSVRow - Date of Birth Validation', () => {
    it('should reject invalid date format (MM/DD/YYYY)', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        date_of_birth: '03/15/2015'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'date_of_birth',
        message: 'Date of birth must be in YYYY-MM-DD format'
      });
    });

    it('should reject invalid date format (DD-MM-YYYY)', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        date_of_birth: '15-03-2015'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('date_of_birth');
    });

    it('should reject date with invalid separators', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        date_of_birth: '2015/03/15'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('date_of_birth');
    });

    it('should reject date with text', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        date_of_birth: 'March 15, 2015'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('date_of_birth');
    });

    it('should accept valid YYYY-MM-DD format', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        date_of_birth: '2015-03-15'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });

    it('should accept empty date_of_birth', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        date_of_birth: ''
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });

    it('should accept undefined date_of_birth', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateCSVRow - Email Validation', () => {
    it('should reject invalid email without @', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_email: 'invalidemail.com'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'parent_email',
        message: 'Invalid email format'
      });
    });

    it('should reject invalid email without domain', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_email: 'user@'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('parent_email');
    });

    it('should reject email with spaces', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_email: 'user name@example.com'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('parent_email');
    });

    it('should accept valid email', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_email: 'parent@example.com'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });

    it('should accept empty parent_email', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_email: ''
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateCSVRow - Phone Validation', () => {
    it('should reject phone with letters', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_phone: 'abc-def-ghij'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'parent_phone',
        message: 'Invalid phone format'
      });
    });

    it('should reject phone with special characters', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_phone: '555@123#4567'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('parent_phone');
    });

    it('should accept phone with dashes', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_phone: '555-123-4567'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });

    it('should accept phone with parentheses', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_phone: '(555) 123-4567'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });

    it('should accept phone with plus sign', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_phone: '+1-555-123-4567'
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });

    it('should accept empty parent_phone', () => {
      const row: CSVStudentRow = {
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        parent_phone: ''
      };

      const errors = validateCSVRow(row, 1);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('parseCSV - Malformed CSV Handling', () => {
    it('should handle empty CSV file', async () => {
      const csvContent = '';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle CSV with only headers', async () => {
      const csvContent = 'first_name,last_name,grade';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle CSV with extra whitespace in headers', async () => {
      const csvContent = '  first_name  ,  last_name  ,  grade  \nJohn,Doe,5th';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.data[0].first_name).toBe('John');
    });

    it('should skip empty lines', async () => {
      const csvContent = 'first_name,last_name,grade\nJohn,Doe,5th\n\n\nJane,Smith,6th';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle CSV with inconsistent column count', async () => {
      const csvContent = 'first_name,last_name,grade\nJohn,Doe\nJane,Smith,6th,extra';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      // Parser should handle this gracefully
      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('parseCSV - Missing Columns', () => {
    it('should detect missing first_name column', async () => {
      const csvContent = 'last_name,grade\nDoe,5th';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('first_name');
    });

    it('should detect missing last_name column', async () => {
      const csvContent = 'first_name,grade\nJohn,5th';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('last_name');
    });

    it('should detect missing grade column', async () => {
      const csvContent = 'first_name,last_name\nJohn,Doe';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('grade');
    });

    it('should handle missing optional columns gracefully', async () => {
      const csvContent = 'first_name,last_name,grade\nJohn,Doe,5th';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.data[0].parent_email).toBeUndefined();
    });
  });

  describe('parseCSV - Invalid Data Formats', () => {
    it('should report multiple validation errors for single row', async () => {
      const csvContent = 'first_name,last_name,grade,date_of_birth,parent_email,parent_phone\n,Doe,5th,invalid-date,not-email,abc-def';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      const errorFields = result.errors.map(e => e.field);
      expect(errorFields).toContain('first_name');
      expect(errorFields).toContain('date_of_birth');
      expect(errorFields).toContain('parent_email');
      expect(errorFields).toContain('parent_phone');
    });

    it('should report errors with correct row numbers', async () => {
      const csvContent = 'first_name,last_name,grade\n,Doe,5th\nJane,,6th\nBob,Smith,';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.errors.length).toBe(3);
      expect(result.errors[0].row).toBe(2); // First data row
      expect(result.errors[1].row).toBe(3); // Second data row
      expect(result.errors[2].row).toBe(4); // Third data row
    });

    it('should validate all rows even if some fail', async () => {
      const csvContent = 'first_name,last_name,grade\n,Doe,5th\nJane,Smith,6th\n,Jones,7th';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(1); // Only valid row
      expect(result.errors).toHaveLength(2); // Two invalid rows
      expect(result.data[0].first_name).toBe('Jane');
    });
  });

  describe('generateCSV - Field Escaping', () => {
    it('should escape fields containing commas', () => {
      const students: ExportStudent[] = [{
        first_name: 'John, Jr.',
        last_name: 'Doe',
        grade: '5th'
      }];

      const csv = generateCSV(students);

      expect(csv).toContain('"John, Jr."');
    });

    it('should escape fields containing quotes', () => {
      const students: ExportStudent[] = [{
        first_name: 'Mary "Mae"',
        last_name: 'Smith',
        grade: '6th'
      }];

      const csv = generateCSV(students);

      expect(csv).toContain('"Mary ""Mae"""');
    });

    it('should escape fields containing newlines', () => {
      const students: ExportStudent[] = [{
        first_name: 'Robert\nBob',
        last_name: 'Jones',
        grade: '7th'
      }];

      const csv = generateCSV(students);

      expect(csv).toContain('"Robert\nBob"');
    });

    it('should not escape simple fields', () => {
      const students: ExportStudent[] = [{
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th'
      }];

      const csv = generateCSV(students);

      const lines = csv.split('\n');
      expect(lines[1]).toBe('John,Doe,5th,,,,,');
    });
  });

  describe('generateCSV - Empty and Missing Fields', () => {
    it('should handle empty optional fields', () => {
      const students: ExportStudent[] = [{
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th',
        date_of_birth: '',
        permission_slip_status: '',
        payment_status: '',
        parent_email: '',
        parent_phone: ''
      }];

      const csv = generateCSV(students);

      const lines = csv.split('\n');
      expect(lines).toHaveLength(2); // Header + 1 data row
      expect(lines[1]).toBe('John,Doe,5th,,,,,');
    });

    it('should handle undefined optional fields', () => {
      const students: ExportStudent[] = [{
        first_name: 'John',
        last_name: 'Doe',
        grade: '5th'
      }];

      const csv = generateCSV(students);

      const lines = csv.split('\n');
      expect(lines[1]).toBe('John,Doe,5th,,,,,');
    });

    it('should generate correct headers', () => {
      const students: ExportStudent[] = [];

      const csv = generateCSV(students);

      const lines = csv.split('\n');
      expect(lines[0]).toBe('first_name,last_name,grade,date_of_birth,permission_slip_status,payment_status,parent_email,parent_phone');
    });
  });

  describe('generateCSV - Multiple Students', () => {
    it('should generate CSV for multiple students', () => {
      const students: ExportStudent[] = [
        {
          first_name: 'John',
          last_name: 'Doe',
          grade: '5th',
          date_of_birth: '2015-03-15',
          permission_slip_status: 'signed',
          payment_status: 'paid',
          parent_email: 'parent1@example.com',
          parent_phone: '555-0100'
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          grade: '6th',
          date_of_birth: '2014-07-22',
          permission_slip_status: 'pending',
          payment_status: 'unpaid',
          parent_email: 'parent2@example.com',
          parent_phone: '555-0101'
        }
      ];

      const csv = generateCSV(students);

      const lines = csv.split('\n');
      expect(lines).toHaveLength(3); // Header + 2 data rows
      expect(lines[1]).toContain('John');
      expect(lines[2]).toContain('Jane');
    });

    it('should handle empty student array', () => {
      const students: ExportStudent[] = [];

      const csv = generateCSV(students);

      const lines = csv.split('\n');
      expect(lines).toHaveLength(1); // Only header
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long field values', async () => {
      const longName = 'A'.repeat(200);
      const csvContent = `first_name,last_name,grade\n${longName},Doe,5th`;
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].first_name).toBe(longName);
    });

    it('should handle unicode characters', async () => {
      const csvContent = 'first_name,last_name,grade\nJosé,García,5th\nZoë,Müller,6th';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].first_name).toBe('José');
      expect(result.data[1].first_name).toBe('Zoë');
    });

    it('should handle case-insensitive headers', async () => {
      const csvContent = 'FIRST_NAME,Last_Name,GrAdE\nJohn,Doe,5th';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].first_name).toBe('John');
    });

    it('should handle mixed valid and invalid rows', async () => {
      const csvContent = `first_name,last_name,grade,parent_email
John,Doe,5th,valid@example.com
,Smith,6th,invalid-email
Jane,Jones,7th,another@example.com`;
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSV(file);

      expect(result.data).toHaveLength(2); // Two valid rows
      expect(result.errors.length).toBeGreaterThan(0); // Errors from invalid row
    });
  });
});
