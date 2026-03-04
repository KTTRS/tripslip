/**
 * FERPA Data Export Utilities
 * Provides functionality for exporting student data in compliance with FERPA
 */

import type { Database } from '@tripslip/database';

type Student = Database['public']['Tables']['students']['Row'];
type PermissionSlip = Database['public']['Tables']['permission_slips']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'];

export interface StudentDataExport {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    grade_level: string;
    date_of_birth?: string;
    medical_conditions?: string;
    allergies?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    created_at: string;
    updated_at: string;
  };
  permission_slips: Array<{
    id: string;
    trip_title: string;
    trip_date: string;
    status: string;
    signed_at?: string;
    parent_name?: string;
    parent_email?: string;
    created_at: string;
  }>;
  trips: Array<{
    id: string;
    title: string;
    trip_date: string;
    venue_name: string;
    teacher_name: string;
    status: string;
  }>;
  audit_logs: Array<{
    timestamp: string;
    action: string;
    user_email: string;
    details: string;
  }>;
  metadata: {
    export_date: string;
    export_requested_by: string;
    data_retention_policy: string;
    ferpa_notice: string;
  };
}

/**
 * Generate FERPA-compliant data export for a student
 */
export async function generateStudentDataExport(
  studentId: string,
  requestedBy: string,
  supabase: any
): Promise<StudentDataExport> {
  // Fetch student data
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    throw new Error('Student not found');
  }

  // Fetch permission slips
  const { data: permissionSlips } = await supabase
    .from('permission_slips')
    .select(`
      id,
      status,
      signed_at,
      parent_first_name,
      parent_last_name,
      parent_email,
      created_at,
      trips (
        title,
        trip_date
      )
    `)
    .eq('student_id', studentId);

  // Fetch trips
  const { data: trips } = await supabase
    .from('trip_students')
    .select(`
      trips (
        id,
        title,
        trip_date,
        status,
        venues (name),
        teachers (first_name, last_name)
      )
    `)
    .eq('student_id', studentId);

  // Fetch audit logs
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select(`
      created_at,
      action,
      table_name,
      record_id,
      metadata,
      users (email)
    `)
    .eq('record_id', studentId)
    .order('created_at', { ascending: false });

  return {
    student: {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      grade_level: student.grade_level,
      date_of_birth: student.date_of_birth,
      medical_conditions: student.medical_conditions,
      allergies: student.allergies,
      emergency_contact_name: student.emergency_contact_name,
      emergency_contact_phone: student.emergency_contact_phone,
      created_at: student.created_at,
      updated_at: student.updated_at,
    },
    permission_slips: (permissionSlips || []).map((slip: any) => ({
      id: slip.id,
      trip_title: slip.trips?.title || 'Unknown',
      trip_date: slip.trips?.trip_date || 'Unknown',
      status: slip.status,
      signed_at: slip.signed_at,
      parent_name: slip.parent_first_name && slip.parent_last_name
        ? `${slip.parent_first_name} ${slip.parent_last_name}`
        : undefined,
      parent_email: slip.parent_email,
      created_at: slip.created_at,
    })),
    trips: (trips || []).map((tripStudent: any) => ({
      id: tripStudent.trips?.id || '',
      title: tripStudent.trips?.title || 'Unknown',
      trip_date: tripStudent.trips?.trip_date || 'Unknown',
      venue_name: tripStudent.trips?.venues?.name || 'Unknown',
      teacher_name: tripStudent.trips?.teachers
        ? `${tripStudent.trips.teachers.first_name} ${tripStudent.trips.teachers.last_name}`
        : 'Unknown',
      status: tripStudent.trips?.status || 'Unknown',
    })),
    audit_logs: (auditLogs || []).map((log: any) => ({
      timestamp: log.created_at,
      action: log.action,
      user_email: log.users?.email || 'System',
      details: `${log.action} on ${log.table_name}`,
    })),
    metadata: {
      export_date: new Date().toISOString(),
      export_requested_by: requestedBy,
      data_retention_policy: '7 years from last activity as per FERPA requirements',
      ferpa_notice: 'This data export contains personally identifiable information (PII) protected under the Family Educational Rights and Privacy Act (FERPA). Unauthorized disclosure is prohibited.',
    },
  };
}

/**
 * Generate CSV export of student data
 */
export function generateStudentDataCSV(exportData: StudentDataExport): string {
  const lines: string[] = [];

  // Header
  lines.push('FERPA-Compliant Student Data Export');
  lines.push(`Export Date: ${exportData.metadata.export_date}`);
  lines.push(`Requested By: ${exportData.metadata.export_requested_by}`);
  lines.push('');

  // Student Information
  lines.push('STUDENT INFORMATION');
  lines.push('Field,Value');
  lines.push(`ID,${exportData.student.id}`);
  lines.push(`Name,"${exportData.student.first_name} ${exportData.student.last_name}"`);
  lines.push(`Grade Level,${exportData.student.grade_level}`);
  if (exportData.student.date_of_birth) {
    lines.push(`Date of Birth,${exportData.student.date_of_birth}`);
  }
  if (exportData.student.medical_conditions) {
    lines.push(`Medical Conditions,"${exportData.student.medical_conditions}"`);
  }
  if (exportData.student.allergies) {
    lines.push(`Allergies,"${exportData.student.allergies}"`);
  }
  lines.push('');

  // Permission Slips
  lines.push('PERMISSION SLIPS');
  lines.push('Trip Title,Trip Date,Status,Signed At,Parent Name,Parent Email');
  exportData.permission_slips.forEach(slip => {
    lines.push(
      `"${slip.trip_title}",${slip.trip_date},${slip.status},${slip.signed_at || 'N/A'},"${slip.parent_name || 'N/A'}",${slip.parent_email || 'N/A'}`
    );
  });
  lines.push('');

  // Trips
  lines.push('TRIPS');
  lines.push('Title,Date,Venue,Teacher,Status');
  exportData.trips.forEach(trip => {
    lines.push(
      `"${trip.title}",${trip.trip_date},"${trip.venue_name}","${trip.teacher_name}",${trip.status}`
    );
  });
  lines.push('');

  // Audit Logs
  lines.push('AUDIT LOGS');
  lines.push('Timestamp,Action,User,Details');
  exportData.audit_logs.forEach(log => {
    lines.push(
      `${log.timestamp},${log.action},${log.user_email},"${log.details}"`
    );
  });
  lines.push('');

  // FERPA Notice
  lines.push('FERPA NOTICE');
  lines.push(`"${exportData.metadata.ferpa_notice}"`);
  lines.push('');
  lines.push(`Data Retention Policy: ${exportData.metadata.data_retention_policy}`);

  return lines.join('\n');
}

/**
 * Generate JSON export of student data
 */
export function generateStudentDataJSON(exportData: StudentDataExport): string {
  return JSON.stringify(exportData, null, 2);
}

/**
 * Data retention check
 * Returns true if data should be retained, false if it can be purged
 */
export function shouldRetainStudentData(lastActivityDate: Date): boolean {
  const retentionYears = 7; // FERPA requirement
  const retentionMs = retentionYears * 365 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const timeSinceActivity = now.getTime() - lastActivityDate.getTime();

  return timeSinceActivity < retentionMs;
}

/**
 * Get students eligible for data purging
 */
export async function getStudentsEligibleForPurge(
  supabase: any
): Promise<Array<{ id: string; last_activity: string }>> {
  const retentionDate = new Date();
  retentionDate.setFullYear(retentionDate.getFullYear() - 7);

  const { data: students } = await supabase
    .from('students')
    .select('id, updated_at')
    .lt('updated_at', retentionDate.toISOString());

  return (students || []).map((student: any) => ({
    id: student.id,
    last_activity: student.updated_at,
  }));
}

/**
 * Anonymize student data (for data retention compliance)
 */
export async function anonymizeStudentData(
  studentId: string,
  supabase: any
): Promise<void> {
  // Update student record with anonymized data
  await supabase
    .from('students')
    .update({
      first_name: 'REDACTED',
      last_name: 'REDACTED',
      date_of_birth: null,
      medical_conditions: null,
      allergies: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      parent_email: null,
      parent_phone: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  // Anonymize permission slips
  await supabase
    .from('permission_slips')
    .update({
      parent_first_name: 'REDACTED',
      parent_last_name: 'REDACTED',
      parent_email: null,
      parent_phone: null,
      signature: null,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  // Log anonymization action
  await supabase.from('audit_logs').insert({
    action: 'anonymize_student_data',
    table_name: 'students',
    record_id: studentId,
    metadata: {
      reason: 'FERPA data retention policy',
      anonymized_at: new Date().toISOString(),
    },
  });
}

/**
 * Parental consent tracking
 */
export interface ParentalConsent {
  student_id: string;
  consent_type: 'data_collection' | 'photo_release' | 'emergency_medical' | 'data_sharing';
  granted: boolean;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}

/**
 * Check if parental consent is valid
 */
export function isConsentValid(consent: ParentalConsent): boolean {
  if (!consent.granted) return false;
  if (!consent.expires_at) return true;

  const expirationDate = new Date(consent.expires_at);
  const now = new Date();

  return now < expirationDate;
}

/**
 * FERPA disclosure log entry
 */
export interface FERPADisclosure {
  student_id: string;
  disclosed_to: string;
  disclosed_by: string;
  disclosure_date: string;
  purpose: string;
  data_disclosed: string[];
  legal_basis: string;
}

/**
 * Log FERPA disclosure
 */
export async function logFERPADisclosure(
  disclosure: FERPADisclosure,
  supabase: any
): Promise<void> {
  await supabase.from('audit_logs').insert({
    action: 'ferpa_disclosure',
    table_name: 'students',
    record_id: disclosure.student_id,
    metadata: {
      disclosed_to: disclosure.disclosed_to,
      disclosed_by: disclosure.disclosed_by,
      disclosure_date: disclosure.disclosure_date,
      purpose: disclosure.purpose,
      data_disclosed: disclosure.data_disclosed,
      legal_basis: disclosure.legal_basis,
    },
  });
}
