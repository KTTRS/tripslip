/**
 * Export Student Data Edge Function
 * FERPA-compliant data export for students
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/security.ts';
import { rateLimitMiddleware, RATE_LIMITS } from '../_shared/rate-limiting.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(req, RATE_LIMITS.API_GENERAL);
    if (rateLimitResponse) return rateLimitResponse;

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request
    const { studentId, format = 'json' } = await req.json();

    if (!studentId) {
      throw new Error('Student ID is required');
    }

    // Verify user has permission to export this student's data
    // Must be school admin, district admin, or the student's teacher
    const { data: roleAssignment } = await supabaseClient
      .from('user_role_assignments')
      .select(`
        role_id,
        organization_type,
        organization_id,
        user_roles!inner(name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!roleAssignment) {
      throw new Error('No active role assignment found');
    }

    const roleName = roleAssignment.user_roles.name;

    // Check if user has permission
    let hasPermission = false;

    if (roleName === 'tripslip_admin') {
      hasPermission = true;
    } else if (roleName === 'school_admin' || roleName === 'district_admin') {
      // Verify student belongs to their organization
      const { data: student } = await supabaseClient
        .from('students')
        .select('school_id')
        .eq('id', studentId)
        .single();

      if (student) {
        if (roleName === 'school_admin') {
          hasPermission = student.school_id === roleAssignment.organization_id;
        } else if (roleName === 'district_admin') {
          // Check if school belongs to district
          const { data: schoolDistrict } = await supabaseClient
            .from('school_districts')
            .select('id')
            .eq('school_id', student.school_id)
            .eq('district_id', roleAssignment.organization_id)
            .single();

          hasPermission = !!schoolDistrict;
        }
      }
    } else if (roleName === 'teacher') {
      // Check if teacher has this student in any of their trips
      const { data: tripStudent } = await supabaseClient
        .from('trip_students')
        .select(`
          trips!inner(teacher_id)
        `)
        .eq('student_id', studentId)
        .eq('trips.teacher_id', user.id)
        .limit(1)
        .single();

      hasPermission = !!tripStudent;
    }

    if (!hasPermission) {
      throw new Error('Unauthorized to export this student data');
    }

    // Generate export data
    const exportData = await generateStudentDataExport(studentId, user.email || user.id, supabaseClient);

    // Log the export action
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'export_student_data',
      table_name: 'students',
      record_id: studentId,
      metadata: {
        format,
        exported_at: new Date().toISOString(),
      },
    });

    // Return data in requested format
    let responseBody: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      responseBody = generateStudentDataCSV(exportData);
      contentType = 'text/csv';
      filename = `student_data_${studentId}_${Date.now()}.csv`;
    } else {
      responseBody = JSON.stringify(exportData, null, 2);
      contentType = 'application/json';
      filename = `student_data_${studentId}_${Date.now()}.json`;
    }

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting student data:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to export student data',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions (simplified versions - full implementation in packages/utils)
async function generateStudentDataExport(studentId: string, requestedBy: string, supabase: any) {
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

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
      trips (title, trip_date)
    `)
    .eq('student_id', studentId);

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('created_at, action, table_name, users(email)')
    .eq('record_id', studentId)
    .order('created_at', { ascending: false })
    .limit(100);

  return {
    student,
    permission_slips: permissionSlips || [],
    audit_logs: auditLogs || [],
    metadata: {
      export_date: new Date().toISOString(),
      export_requested_by: requestedBy,
      ferpa_notice: 'This data export contains PII protected under FERPA.',
    },
  };
}

function generateStudentDataCSV(exportData: any): string {
  const lines: string[] = [];
  lines.push('FERPA-Compliant Student Data Export');
  lines.push(`Export Date: ${exportData.metadata.export_date}`);
  lines.push('');
  lines.push('Student Information');
  lines.push(`ID,${exportData.student.id}`);
  lines.push(`Name,${exportData.student.first_name} ${exportData.student.last_name}`);
  lines.push(`Grade,${exportData.student.grade_level}`);
  return lines.join('\n');
}
