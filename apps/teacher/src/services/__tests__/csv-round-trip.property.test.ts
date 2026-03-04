/**
 * Property-Based Tests - CSV Roster Round Trip (Task 4.5)
 * 
 * Tests Property 17: CSV Roster Round Trip
 * For any valid roster data, if we export it to CSV and then import it back,
 * the resulting roster should match the original data (excluding auto-generated
 * fields like IDs and timestamps).
 * 
 * **Validates: Requirements 5.3, 5.8**
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as fc from 'fast-check';

// Mock the Supabase client before importing csv-service
vi.mock('@tripslip/database', () => ({
  createSupabaseClient: vi.fn(() => ({}))
}));

import { generateCSV, parseCSV, validateCSVRow, type CSVStudentRow, type ExportStudent } from '../csv-service';

describe('Property-Based Tests - CSV Roster Round Trip (Task 4.5)', () => {
  /**
   * Property 17: CSV Roster Round Trip
   * 
   * For any valid CSV roster data, exporting to CSV format and then parsing
   * it back should produce equivalent data. This ensures data integrity through
   * the export/import cycle.
   * 
   * The property verifies:
   * - All student data is preserved
   * - Field values remain unchanged
   * - Optional fields are handled correctly
   * - Data formatting is consistent
   */
  it('Property 17: CSV export then import preserves all roster data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of valid student records
        fc.array(
          fc.record({
            first_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            last_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            grade: fc.constantFrom('K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'),
            date_of_birth: fc.option(
              fc.date({ min: new Date('2005-01-01'), max: new Date('2020-12-31') })
                .map(d => d.toISOString().split('T')[0]),
              { nil: undefined }
            ),
            permission_slip_status: fc.constantFrom('pending', 'signed', 'declined'),
            payment_status: fc.constantFrom('unpaid', 'paid', 'refunded'),
            parent_email: fc.option(
              fc.emailAddress(),
              { nil: undefined }
            ),
            parent_phone: fc.option(
              fc.string({ minLength: 10, maxLength: 15 }).map(s => 
                s.replace(/[^\d]/g, '').slice(0, 10).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
              ),
              { nil: undefined }
            )
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (students) => {
          // Convert to export format
          const exportData: ExportStudent[] = students.map(s => ({
            first_name: s.first_name,
            last_name: s.last_name,
            grade: s.grade,
            date_of_birth: s.date_of_birth || '',
            permission_slip_status: s.permission_slip_status || '',
            payment_status: s.payment_status || '',
            parent_email: s.parent_email || '',
            parent_phone: s.parent_phone || ''
          }));

          // Export to CSV
          const csvContent = generateCSV(exportData);
          expect(csvContent).toBeTruthy();
          expect(csvContent.length).toBeGreaterThan(0);

          // Parse CSV back
          const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
          const { data: parsedData, errors } = await parseCSV(csvFile);

          // Should have no parsing errors
          expect(errors).toHaveLength(0);
          expect(parsedData).toHaveLength(students.length);

          // Verify each student's data is preserved
          parsedData.forEach((parsed, index) => {
            const original = students[index];

            // Required fields must match exactly
            expect(parsed.first_name.trim()).toBe(original.first_name.trim());
            expect(parsed.last_name.trim()).toBe(original.last_name.trim());
            expect(parsed.grade.trim()).toBe(original.grade);

            // Optional fields - check if present in original
            if (original.date_of_birth) {
              expect(parsed.date_of_birth).toBe(original.date_of_birth);
            }

            if (original.parent_email) {
              expect(parsed.parent_email).toBe(original.parent_email);
            }

            if (original.parent_phone) {
              expect(parsed.parent_phone).toBe(original.parent_phone);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 17 (Edge Case): Empty optional fields are preserved
   * 
   * When optional fields are empty, they should remain empty through
   * the export/import cycle, not be converted to null or undefined.
   */
  it('Property 17 (Edge Case): Empty optional fields remain empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            first_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            last_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            grade: fc.constantFrom('K', '1st', '2nd', '3rd', '4th', '5th', '6th'),
            // All optional fields empty
            date_of_birth: fc.constant(''),
            permission_slip_status: fc.constant(''),
            payment_status: fc.constant(''),
            parent_email: fc.constant(''),
            parent_phone: fc.constant('')
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (students) => {
          const exportData: ExportStudent[] = students.map(s => ({
            first_name: s.first_name,
            last_name: s.last_name,
            grade: s.grade,
            date_of_birth: s.date_of_birth,
            permission_slip_status: s.permission_slip_status,
            payment_status: s.payment_status,
            parent_email: s.parent_email,
            parent_phone: s.parent_phone
          }));

          const csvContent = generateCSV(exportData);
          const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
          const { data: parsedData, errors } = await parseCSV(csvFile);

          expect(errors).toHaveLength(0);
          expect(parsedData).toHaveLength(students.length);

          parsedData.forEach((parsed, index) => {
            const original = students[index];
            expect(parsed.first_name.trim()).toBe(original.first_name.trim());
            expect(parsed.last_name.trim()).toBe(original.last_name.trim());
            expect(parsed.grade.trim()).toBe(original.grade);
            
            // Empty fields should remain empty (or undefined)
            expect(parsed.date_of_birth || '').toBe('');
            expect(parsed.parent_email || '').toBe('');
            expect(parsed.parent_phone || '').toBe('');
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 17 (Edge Case): Special characters in names are preserved
   * 
   * Names with special characters (hyphens, apostrophes, accents) should
   * be preserved correctly through CSV export/import.
   */
  it('Property 17 (Edge Case): Special characters in names are preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            first_name: fc.constantFrom(
              "Mary-Jane", "O'Brien", "José", "François", "Zoë", "Søren"
            ),
            last_name: fc.constantFrom(
              "Smith-Jones", "O'Connor", "García", "Müller", "Øvergård"
            ),
            grade: fc.constantFrom('3rd', '4th', '5th'),
            date_of_birth: fc.constant('2015-05-15'),
            permission_slip_status: fc.constant('pending'),
            payment_status: fc.constant('unpaid'),
            parent_email: fc.emailAddress(),
            parent_phone: fc.constant('555-0100')
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (students) => {
          const exportData: ExportStudent[] = students.map(s => ({
            first_name: s.first_name,
            last_name: s.last_name,
            grade: s.grade,
            date_of_birth: s.date_of_birth,
            permission_slip_status: s.permission_slip_status,
            payment_status: s.payment_status,
            parent_email: s.parent_email,
            parent_phone: s.parent_phone
          }));

          const csvContent = generateCSV(exportData);
          const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
          const { data: parsedData, errors } = await parseCSV(csvFile);

          expect(errors).toHaveLength(0);
          expect(parsedData).toHaveLength(students.length);

          parsedData.forEach((parsed, index) => {
            const original = students[index];
            // Special characters should be preserved exactly
            expect(parsed.first_name).toBe(original.first_name);
            expect(parsed.last_name).toBe(original.last_name);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 17 (Edge Case): Commas and quotes in fields are handled correctly
   * 
   * CSV fields containing commas, quotes, or newlines should be properly
   * escaped and preserved through the export/import cycle.
   */
  it('Property 17 (Edge Case): Commas and quotes in fields are escaped correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            first_name: fc.constantFrom(
              'John, Jr.', 'Mary "Mae"', 'Robert\nBob'
            ),
            last_name: fc.constantFrom(
              'Smith, III', 'O"Brien', 'Jones\nFamily'
            ),
            grade: fc.constantFrom('5th', '6th'),
            date_of_birth: fc.constant('2014-03-20'),
            permission_slip_status: fc.constant('pending'),
            payment_status: fc.constant('unpaid'),
            parent_email: fc.emailAddress(),
            parent_phone: fc.constant('555-0200')
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (students) => {
          const exportData: ExportStudent[] = students.map(s => ({
            first_name: s.first_name,
            last_name: s.last_name,
            grade: s.grade,
            date_of_birth: s.date_of_birth,
            permission_slip_status: s.permission_slip_status,
            payment_status: s.payment_status,
            parent_email: s.parent_email,
            parent_phone: s.parent_phone
          }));

          const csvContent = generateCSV(exportData);
          const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
          const { data: parsedData, errors } = await parseCSV(csvFile);

          expect(errors).toHaveLength(0);
          expect(parsedData).toHaveLength(students.length);

          parsedData.forEach((parsed, index) => {
            const original = students[index];
            // Special CSV characters should be preserved
            expect(parsed.first_name).toBe(original.first_name);
            expect(parsed.last_name).toBe(original.last_name);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 17 (Consistency): Multiple round trips preserve data
   * 
   * Performing multiple export/import cycles should not degrade data quality.
   * Data should remain consistent across multiple round trips.
   */
  it('Property 17 (Consistency): Multiple round trips preserve data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            first_name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            last_name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            grade: fc.constantFrom('K', '1st', '2nd', '3rd', '4th', '5th'),
            date_of_birth: fc.date({ min: new Date('2010-01-01'), max: new Date('2018-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            permission_slip_status: fc.constantFrom('pending', 'signed'),
            payment_status: fc.constantFrom('unpaid', 'paid'),
            parent_email: fc.emailAddress(),
            parent_phone: fc.constant('555-0300')
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (students) => {
          let currentData: ExportStudent[] = students.map(s => ({
            first_name: s.first_name,
            last_name: s.last_name,
            grade: s.grade,
            date_of_birth: s.date_of_birth,
            permission_slip_status: s.permission_slip_status,
            payment_status: s.payment_status,
            parent_email: s.parent_email,
            parent_phone: s.parent_phone
          }));

          // Perform 3 round trips
          for (let i = 0; i < 3; i++) {
            // Export to CSV
            const csvContent = generateCSV(currentData);
            
            // Parse back
            const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
            const { data: parsedData, errors } = await parseCSV(csvFile);
            
            expect(errors).toHaveLength(0);
            expect(parsedData).toHaveLength(students.length);

            // Update current data for next iteration
            currentData = parsedData.map(p => ({
              first_name: p.first_name,
              last_name: p.last_name,
              grade: p.grade,
              date_of_birth: p.date_of_birth || '',
              permission_slip_status: '',
              payment_status: '',
              parent_email: p.parent_email || '',
              parent_phone: p.parent_phone || ''
            }));
          }

          // After 3 round trips, verify data still matches original
          currentData.forEach((final, index) => {
            const original = students[index];
            expect(final.first_name.trim()).toBe(original.first_name.trim());
            expect(final.last_name.trim()).toBe(original.last_name.trim());
            expect(final.grade.trim()).toBe(original.grade);
            expect(final.date_of_birth).toBe(original.date_of_birth);
            expect(final.parent_email).toBe(original.parent_email);
            expect(final.parent_phone).toBe(original.parent_phone);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 17 (Validation): Invalid data is rejected during import
   * 
   * When importing CSV data, validation should catch invalid entries
   * and report appropriate errors without corrupting valid data.
   */
  it('Property 17 (Validation): Invalid CSV data is properly rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          first_name: fc.constant(''), // Invalid: empty
          last_name: fc.string({ minLength: 1, maxLength: 30 }),
          grade: fc.string({ minLength: 1, maxLength: 10 }),
          date_of_birth: fc.constant('invalid-date'), // Invalid format
          parent_email: fc.constant('not-an-email'), // Invalid email
          parent_phone: fc.constant('abc-def-ghij') // Invalid phone
        }),
        async (invalidStudent) => {
          const exportData: ExportStudent[] = [{
            first_name: invalidStudent.first_name,
            last_name: invalidStudent.last_name,
            grade: invalidStudent.grade,
            date_of_birth: invalidStudent.date_of_birth,
            permission_slip_status: '',
            payment_status: '',
            parent_email: invalidStudent.parent_email,
            parent_phone: invalidStudent.parent_phone
          }];

          const csvContent = generateCSV(exportData);
          const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
          const { data: parsedData, errors } = await parseCSV(csvFile);

          // Should have validation errors
          expect(errors.length).toBeGreaterThan(0);
          
          // Should report specific field errors
          const errorFields = errors.map(e => e.field);
          expect(errorFields).toContain('first_name'); // Empty first name
          expect(errorFields).toContain('date_of_birth'); // Invalid date format
          expect(errorFields).toContain('parent_email'); // Invalid email
          expect(errorFields).toContain('parent_phone'); // Invalid phone
        }
      ),
      { numRuns: 20 }
    );
  });
});
