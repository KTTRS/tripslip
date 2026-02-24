import { supabase } from './supabase';
import type {
  Experience,
  Invitation,
  Student,
  Guardian,
  PermissionSlip,
  Payment,
} from './types';

// ── Row types (DB column names) ──────────────────────────────
interface ExperienceRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cost_cents: number;
  payment_description: string | null;
  donation_message: string | null;
  indemnification: string | null;
}

interface InvitationRow {
  id: string;
  experience_id: string;
  school: string;
  teacher: string;
  teacher_email: string;
  status: string;
}

interface StudentRow {
  id: string;
  invitation_id: string;
  first_name: string;
  last_name: string;
  grade: string;
}

interface GuardianRow {
  id: string;
  student_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  language: string | null;
}

interface SlipRow {
  id: string;
  invitation_id: string;
  student_id: string;
  token: string;
  status: string;
  form_data: Record<string, unknown> | null;
  signature_data: string | null;
  signed_at: string | null;
}

interface PaymentRow {
  id: string;
  slip_id: string;
  payment_type: string;
  payment_method: string | null;
  amount_cents: number;
  success: boolean;
}

// ── Mappers: DB row → app type ───────────────────────────────
function toExperience(r: ExperienceRow): Experience {
  return {
    id: r.id,
    title: r.title,
    desc: r.description ?? '',
    date: r.event_date,
    time: r.event_time ?? '',
    loc: r.location ?? '',
    cents: r.cost_cents,
    payDesc: r.payment_description ?? '',
    donMsg: r.donation_message ?? '',
    indemnification: r.indemnification ?? '',
  };
}

function toInvitation(r: InvitationRow): Invitation {
  return {
    id: r.id,
    expId: r.experience_id,
    school: r.school,
    teacher: r.teacher,
    email: r.teacher_email,
    status: r.status as Invitation['status'],
  };
}

function toStudent(r: StudentRow): Student {
  return { id: r.id, inv: r.invitation_id, f: r.first_name, l: r.last_name, gr: r.grade };
}

function toGuardian(r: GuardianRow): Guardian {
  return {
    sid: r.student_id,
    name: r.full_name,
    phone: r.phone,
    email: r.email ?? '',
    lang: r.language ?? undefined,
  };
}

function toSlip(r: SlipRow): PermissionSlip {
  return {
    id: r.id,
    inv: r.invitation_id,
    sid: r.student_id,
    tok: r.token,
    status: r.status as PermissionSlip['status'],
  };
}

function toPayment(r: PaymentRow): Payment {
  return {
    slid: r.slip_id,
    type: r.payment_type as Payment['type'],
    cents: r.amount_cents,
    ok: r.success,
  };
}

// ── Fetch all data ───────────────────────────────────────────
export interface AllData {
  experiences: Experience[];
  invitations: Invitation[];
  students: Student[];
  guardians: Guardian[];
  slips: PermissionSlip[];
  payments: Payment[];
}

export async function fetchAllData(): Promise<AllData | null> {
  if (!supabase) return null;

  const [expRes, invRes, stuRes, grdRes, slpRes, payRes] = await Promise.all([
    supabase.from('experiences').select('*'),
    supabase.from('invitations').select('*'),
    supabase.from('students').select('*'),
    supabase.from('guardians').select('*'),
    supabase.from('permission_slips').select('*'),
    supabase.from('payments').select('*'),
  ]);

  if (expRes.error || invRes.error || stuRes.error || grdRes.error || slpRes.error || payRes.error) {
    console.error('Supabase fetch errors:', {
      experiences: expRes.error,
      invitations: invRes.error,
      students: stuRes.error,
      guardians: grdRes.error,
      slips: slpRes.error,
      payments: payRes.error,
    });
    return null;
  }

  return {
    experiences: (expRes.data as ExperienceRow[]).map(toExperience),
    invitations: (invRes.data as InvitationRow[]).map(toInvitation),
    students: (stuRes.data as StudentRow[]).map(toStudent),
    guardians: (grdRes.data as GuardianRow[]).map(toGuardian),
    slips: (slpRes.data as SlipRow[]).map(toSlip),
    payments: (payRes.data as PaymentRow[]).map(toPayment),
  };
}

// ── Write operations ─────────────────────────────────────────
export async function dbInsertExperience(exp: Experience): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('experiences').insert({
    id: exp.id,
    title: exp.title,
    description: exp.desc,
    event_date: exp.date,
    event_time: exp.time,
    location: exp.loc,
    cost_cents: exp.cents,
    payment_description: exp.payDesc,
    donation_message: exp.donMsg,
    indemnification: exp.indemnification,
  });
  if (error) console.error('Insert experience error:', error);
  return !error;
}

export async function dbInsertStudents(
  students: Student[],
  guardians: Guardian[],
  slips: PermissionSlip[],
): Promise<boolean> {
  if (!supabase) return false;

  const { error: stuErr } = await supabase.from('students').insert(
    students.map((s) => ({
      id: s.id,
      invitation_id: s.inv,
      first_name: s.f,
      last_name: s.l,
      grade: s.gr,
    })),
  );
  if (stuErr) { console.error('Insert students error:', stuErr); return false; }

  const { error: grdErr } = await supabase.from('guardians').insert(
    guardians.map((g) => ({
      student_id: g.sid,
      full_name: g.name,
      phone: g.phone,
      email: g.email,
      language: g.lang ?? 'en',
    })),
  );
  if (grdErr) { console.error('Insert guardians error:', grdErr); return false; }

  const { error: slpErr } = await supabase.from('permission_slips').insert(
    slips.map((s) => ({
      id: s.id,
      invitation_id: s.inv,
      student_id: s.sid,
      token: s.tok,
      status: s.status,
    })),
  );
  if (slpErr) { console.error('Insert slips error:', slpErr); return false; }

  return true;
}

export async function dbUpdateSlipStatus(
  slipId: string,
  status: PermissionSlip['status'],
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('permission_slips')
    .update({ status })
    .eq('id', slipId);
  if (error) console.error('Update slip status error:', error);
  return !error;
}

export async function dbUpdateSlipsBatch(
  slipIds: string[],
  status: PermissionSlip['status'],
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('permission_slips')
    .update({ status })
    .in('id', slipIds);
  if (error) console.error('Batch update slips error:', error);
  return !error;
}

export async function dbCompleteSlip(
  slipId: string,
  formData: Record<string, unknown>,
  signatureData: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('permission_slips')
    .update({
      status: 'COMPLETED',
      form_data: formData,
      signature_data: signatureData,
      signed_at: new Date().toISOString(),
    })
    .eq('id', slipId);
  if (error) console.error('Complete slip error:', error);
  return !error;
}

export async function dbInsertPayment(payment: {
  slipId: string;
  type: 'REQ' | 'DON';
  method: string;
  cents: number;
  success: boolean;
}): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('payments').insert({
    slip_id: payment.slipId,
    payment_type: payment.type,
    payment_method: payment.method,
    amount_cents: payment.cents,
    success: payment.success,
  });
  if (error) console.error('Insert payment error:', error);
  return !error;
}
