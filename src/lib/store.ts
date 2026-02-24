import { create } from 'zustand';
import type {
  Experience,
  Invitation,
  Student,
  Guardian,
  PermissionSlip,
  Payment,
  FormField,
  SchoolAddendum,
  ImportRow,
} from './types';
import {
  fetchAllData,
  dbInsertExperience,
  dbInsertStudents,
  dbUpdateSlipStatus,
  dbUpdateSlipsBatch,
  subscribeRealtime,
} from './db';
import type { RealtimeEvent } from './db';

// ── Legal Documents ──────────────────────────────────────────
const DEFAULT_INDEMNIFICATION = `PERMISSION, WAIVER, AND RELEASE OF LIABILITY

I, the undersigned parent or legal guardian of the student named below ("Student"), hereby grant permission for my Student to participate in the Junior Achievement Stock Market Challenge 2026 ("Activity"), including all related events, instruction, and transportation arranged by Junior Achievement of Southeastern Michigan ("JA") and the Student's school.

ASSUMPTION OF RISK: I understand that participation in the Activity may involve certain risks, including but not limited to: transportation to and from the Activity venue; physical activities and group exercises; interaction with other students, volunteers, and JA staff; use of technology and equipment at the JA Finance Park facility. I voluntarily assume all risks associated with my Student's participation.

RELEASE AND WAIVER: In consideration of my Student being permitted to participate, I hereby release, waive, discharge, and covenant not to sue JA, its officers, directors, employees, volunteers, agents, and sponsors, as well as the Student's school and school district, their officers, directors, employees, and agents (collectively, "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury, including death, that may be sustained by the Student while participating in the Activity, or while in, on, or around the premises where the Activity is being conducted, or during transportation to and from the Activity.

INDEMNIFICATION: I agree to indemnify and hold harmless the Released Parties from any loss, liability, damage, or costs, including attorney fees, that they may incur due to the Student's participation in the Activity, whether caused by negligence of the Released Parties or otherwise.

MEDICAL AUTHORIZATION: In the event of an emergency, I authorize JA staff and volunteers to seek and consent to medical treatment for the Student, including but not limited to first aid, CPR, and emergency medical services. I understand that I will be responsible for all costs of medical treatment.

PHOTO/VIDEO RELEASE (Optional): By checking the appropriate box below, I grant JA permission to photograph, video record, and otherwise capture images of my Student during the Activity for use in educational materials, promotional content, social media, and other JA communications.

ACKNOWLEDGMENT: I have read this Permission, Waiver, and Release of Liability in its entirety and fully understand its terms. I understand that I am giving up substantial rights, including my right to sue. I acknowledge that I am signing this agreement freely and voluntarily, and intend my signature to be a complete and unconditional release of all liability to the greatest extent allowed by law.`;

export const SCHOOL_ADDENDUMS: Record<string, SchoolAddendum> = {
  i0: {
    name: 'Cass Tech',
    text: `SUPPLEMENTAL SCHOOL PERMISSION — CASS TECH HIGH SCHOOL

In addition to the permission granted to Junior Achievement, I hereby authorize Cass Technical High School and Detroit Public Schools Community District (DPSCD) to permit my Student to participate in off-campus activities related to the JA Stock Market Challenge, including supervised transportation by school-approved bus services.

I confirm that the contact and medical information provided is current and accurate. I understand that DPSCD policies regarding student conduct and discipline apply during all off-campus activities.

I acknowledge that Cass Tech faculty and staff chaperones will supervise students during the Activity and that students are expected to follow all school rules and the instructions of supervising adults at all times.`,
  },
  i2: {
    name: 'Southeastern',
    text: `SUPPLEMENTAL SCHOOL PERMISSION — SOUTHEASTERN HIGH SCHOOL

In addition to the permission granted to Junior Achievement, I hereby authorize Southeastern High School and Detroit Public Schools Community District (DPSCD) to permit my Student to participate in off-campus activities related to the JA Stock Market Challenge.

I understand that DPSCD policies regarding student conduct and discipline apply during all off-campus activities. Students are expected to follow all school rules and the instructions of supervising adults.`,
  },
};

// ── Initial Demo Data ────────────────────────────────────────
const INIT_EXPERIENCES: Experience[] = [
  {
    id: 'exp1',
    title: 'Stock Market Challenge 2026',
    desc: '6-week experiential program — student teams manage virtual portfolios competing across Detroit schools.',
    date: 'March 15, 2026',
    time: '9:00 AM – 2:30 PM',
    loc: 'JA Finance Park, Detroit',
    cents: 1500,
    payDesc: 'Bus transportation fee',
    donMsg: 'Every dollar goes directly to the TripSlip Field Trip Fund — ensuring no student misses out because of cost.',
    indemnification: DEFAULT_INDEMNIFICATION,
  },
  {
    id: 'exp2',
    title: 'JA BizTown 2026',
    desc: 'Students run an entire simulated city — serving as mayor, bank teller, news anchor, and more.',
    date: 'April 10, 2026',
    time: '8:30 AM – 1:00 PM',
    loc: 'JA BizTown, Dearborn',
    cents: 1200,
    payDesc: 'Bus transportation fee',
    donMsg: 'Fund a student\'s BizTown experience — every dollar counts.',
    indemnification: DEFAULT_INDEMNIFICATION,
  },
  {
    id: 'exp3',
    title: 'Finance Park Day',
    desc: 'Hands-on personal finance simulation — budgeting, saving, investing in a realistic adult scenario.',
    date: 'May 5, 2026',
    time: '9:00 AM – 2:00 PM',
    loc: 'JA Finance Park, Detroit',
    cents: 1000,
    payDesc: 'Activity fee',
    donMsg: 'Help every student experience financial literacy firsthand.',
    indemnification: DEFAULT_INDEMNIFICATION,
  },
];

const INIT_INVITATIONS: Invitation[] = [
  { id: 'i0', expId: 'exp1', school: 'Cass Tech', teacher: 'Ms. Rodriguez', email: 'rodriguez@cass.dpscd.org', status: 'ACTIVE' },
  { id: 'i1', expId: 'exp1', school: 'DPSCD Virtual', teacher: 'Mr. Thompson', email: 'thompson@virtual.dpscd.org', status: 'ACTIVE' },
  { id: 'i2', expId: 'exp1', school: 'Southeastern', teacher: 'Mrs. Williams', email: 'williams@se.dpscd.org', status: 'ACTIVE' },
  { id: 'i3', expId: 'exp1', school: 'Renaissance', teacher: 'Mr. Davis', email: 'davis@ren.dpscd.org', status: 'SENT' },
  { id: 'i4', expId: 'exp1', school: 'Henry Ford Academy', teacher: 'Ms. Chen', email: 'chen@hfa.edu', status: 'SENT' },
  { id: 'i5', expId: 'exp1', school: 'Marygrove / CMA', teacher: 'Mrs. Johnson', email: 'johnson@marygrove.edu', status: 'PENDING' },
  { id: 'i6', expId: 'exp2', school: 'Cass Tech', teacher: 'Ms. Rodriguez', email: 'rodriguez@cass.dpscd.org', status: 'SENT' },
  { id: 'i7', expId: 'exp2', school: 'DPSCD Virtual', teacher: 'Mr. Thompson', email: 'thompson@virtual.dpscd.org', status: 'PENDING' },
];

const INIT_STUDENTS: Student[] = [
  { id: 's0', inv: 'i0', f: 'Jaylen', l: 'Carter', gr: '11' },
  { id: 's1', inv: 'i0', f: 'Nia', l: 'Washington', gr: '11' },
  { id: 's2', inv: 'i0', f: 'Marcus', l: 'Thompson', gr: '11' },
  { id: 's3', inv: 'i0', f: 'Amara', l: 'Okafor', gr: '11' },
  { id: 's4', inv: 'i0', f: 'DeShawn', l: 'Mitchell', gr: '11' },
  { id: 's5', inv: 'i0', f: 'Zoe', l: 'Kim', gr: '11' },
  { id: 's6', inv: 'i0', f: 'Isaiah', l: 'Brown', gr: '11' },
  { id: 's7', inv: 'i0', f: 'Aaliyah', l: 'Jackson', gr: '11' },
  { id: 's8', inv: 'i0', f: 'Tyler', l: 'Garcia', gr: '11' },
  { id: 's9', inv: 'i0', f: 'Destiny', l: 'Williams', gr: '11' },
  { id: 'x0', inv: 'i2', f: 'Malik', l: 'Reed', gr: '10' },
  { id: 'x1', inv: 'i2', f: 'Jasmine', l: 'Cole', gr: '10' },
  { id: 'x2', inv: 'i2', f: 'Andre', l: 'Price', gr: '10' },
  { id: 'x3', inv: 'i2', f: 'Kayla', l: 'Foster', gr: '10' },
  { id: 'x4', inv: 'i2', f: 'Elijah', l: 'Grant', gr: '10' },
];

const INIT_GUARDIANS: Guardian[] = [
  { sid: 's0', name: 'Michelle Carter', phone: '+13135551001', email: 'm.carter@gmail.com' },
  { sid: 's1', name: 'Derek Washington', phone: '+13135551002', email: 'd.wash@yahoo.com' },
  { sid: 's2', name: 'Lisa Thompson', phone: '+13135551003', email: 'lisa.t@gmail.com' },
  { sid: 's3', name: 'Chidi Okafor', phone: '+13135551004', email: 'c.okafor@outlook.com' },
  { sid: 's4', name: 'Tamika Mitchell', phone: '+13135551005', email: 'tamika.m@gmail.com' },
  { sid: 's5', name: 'James Kim', phone: '+13135551006', email: 'j.kim@gmail.com' },
  { sid: 's6', name: 'Angela Brown', phone: '+13135551007', email: 'a.brown@aol.com' },
  { sid: 's7', name: 'Robert Jackson', phone: '+13135551008', email: 'r.jackson@gmail.com' },
  { sid: 's8', name: 'Maria Garcia', phone: '+13135551009', email: 'm.garcia@gmail.com', lang: 'es' },
  { sid: 's9', name: 'Kevin Williams', phone: '+13135551010', email: 'k.will@gmail.com' },
  { sid: 'x0', name: 'Sandra Reed', phone: '+13135552000', email: 'sandra@mail.com' },
  { sid: 'x1', name: 'Tony Cole', phone: '+13135552001', email: 'tony@mail.com' },
  { sid: 'x2', name: 'Diana Price', phone: '+13135552002', email: 'diana@mail.com' },
  { sid: 'x3', name: 'Marcus Foster', phone: '+13135552003', email: 'marcus@mail.com' },
  { sid: 'x4', name: 'Tina Grant', phone: '+13135552004', email: 'tina@mail.com' },
];

const STATUS_SEQ: PermissionSlip['status'][] = [
  'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
  'OPENED', 'OPENED',
  'SENT', 'SENT',
  'PENDING', 'PENDING',
];

const INIT_SLIPS: PermissionSlip[] = INIT_STUDENTS.map((s, i) => {
  const st: PermissionSlip['status'] =
    s.inv === 'i0'
      ? STATUS_SEQ[i] || 'PENDING'
      : i - 10 < 2
        ? 'COMPLETED'
        : i - 10 < 3
          ? 'OPENED'
          : 'SENT';
  return { id: `sl-${s.id}`, inv: s.inv, sid: s.id, tok: `tok-${s.id}`, status: st };
});

const INIT_PAYMENTS: Payment[] = [
  { id: 'pay-1', slid: 'sl-s0', type: 'REQ', cents: 1500, ok: true },
  { id: 'pay-2', slid: 'sl-s0', type: 'DON', cents: 2500, ok: true },
  { id: 'pay-3', slid: 'sl-s1', type: 'REQ', cents: 1500, ok: true },
  { id: 'pay-4', slid: 'sl-s2', type: 'REQ', cents: 1500, ok: true },
  { id: 'pay-5', slid: 'sl-s3', type: 'REQ', cents: 1500, ok: false },
  { id: 'pay-6', slid: 'sl-x0', type: 'REQ', cents: 1500, ok: true },
  { id: 'pay-7', slid: 'sl-x1', type: 'REQ', cents: 1500, ok: true },
];

// ── Form Fields (global template) ────────────────────────────
export const FORM_FIELDS: FormField[] = [
  { id: 'h1', type: 'heading', label: 'Student Information' },
  { id: 'f2', type: 'text', label: 'Student Full Legal Name', req: true, pre: 'stu' },
  { id: 'f3', type: 'date', label: 'Date of Birth', req: true },
  { id: 'f4', type: 'text', label: 'Grade', req: true, pre: 'gr' },
  { id: 'h2', type: 'heading', label: 'Parent / Guardian Information' },
  { id: 'f6', type: 'text', label: 'Parent/Guardian Full Name', req: true, pre: 'gN' },
  { id: 'f7', type: 'text', label: 'Phone Number', req: true, pre: 'gP' },
  { id: 'f8', type: 'text', label: 'Email Address', pre: 'gE' },
  { id: 'h3', type: 'heading', label: 'Emergency & Medical' },
  { id: 'f10', type: 'text', label: 'Emergency Contact (if different)' },
  { id: 'f11', type: 'text', label: 'Emergency Contact Phone' },
  {
    id: 'f12',
    type: 'drop',
    label: 'T-Shirt Size',
    opts: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL'],
    req: true,
  },
  { id: 'f13', type: 'area', label: 'Allergies, Medical Conditions, or Medications', ph: 'Leave blank if none' },
  { id: 'h4', type: 'heading', label: 'Permission & Release' },
  { id: 'f15', type: 'doc', label: 'Permission, Waiver & Release of Liability' },
  {
    id: 'f16',
    type: 'chk',
    label: 'I have read and agree to the Permission, Waiver, and Release of Liability above. I give permission for my student to participate, including transportation.',
    req: true,
  },
  {
    id: 'f17',
    type: 'chk',
    label: 'I authorize JA to use photos/videos of my student for educational and promotional purposes. (Optional)',
  },
];

// ── Realtime merge helper ────────────────────────────────────
function mergeList<T>(
  list: T[],
  item: T,
  key: keyof T,
  evt: RealtimeEvent,
  appendOnly = false,
): T[] {
  if (evt === 'DELETE') return list.filter((r) => r[key] !== item[key]);
  if (evt === 'INSERT' || appendOnly) {
    // Avoid duplicates
    const exists = list.some((r) => r[key] === item[key]);
    return exists ? list.map((r) => (r[key] === item[key] ? item : r)) : [...list, item];
  }
  // UPDATE
  return list.map((r) => (r[key] === item[key] ? item : r));
}

// ── Zustand Store ────────────────────────────────────────────
let _counter = 100;
function uid() {
  return `gen-${Date.now()}-${_counter++}`;
}

interface AppState {
  // Data
  experiences: Experience[];
  invitations: Invitation[];
  students: Student[];
  guardians: Guardian[];
  slips: PermissionSlip[];
  payments: Payment[];

  // Loading state
  loading: boolean;
  dataSource: 'demo' | 'supabase';

  // Actions
  init: () => Promise<void>;
  addExperience: (exp: Omit<Experience, 'id'>) => void;
  importStudents: (invId: string, rows: ImportRow[]) => void;
  sendSlip: (slipId: string) => void;
  sendAllPending: (invId: string) => void;
  remindSlip: (slipId: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  experiences: INIT_EXPERIENCES,
  invitations: INIT_INVITATIONS,
  students: INIT_STUDENTS,
  guardians: INIT_GUARDIANS,
  slips: INIT_SLIPS,
  payments: INIT_PAYMENTS,

  loading: true,
  dataSource: 'demo',

  init: async () => {
    set({ loading: true });
    const data = await fetchAllData();
    if (data && data.experiences.length > 0) {
      set({ ...data, loading: false, dataSource: 'supabase' });

      // Subscribe to realtime changes
      subscribeRealtime({
        onSlip: (evt, slip) => {
          set((s) => ({ slips: mergeList(s.slips, slip, 'id', evt) }));
        },
        onPayment: (evt, payment) => {
          set((s) => ({ payments: mergeList(s.payments, payment, 'id', evt) }));
        },
        onStudent: (evt, student) => {
          set((s) => ({ students: mergeList(s.students, student, 'id', evt) }));
        },
        onGuardian: (evt, guardian) => {
          set((s) => ({ guardians: mergeList(s.guardians, guardian, 'sid', evt) }));
        },
      });
    } else {
      // Fall back to demo data (already set as initial state)
      set({ loading: false, dataSource: 'demo' });
    }
  },

  addExperience: (exp) => {
    const newExp = { ...exp, id: uid() };
    set((s) => ({ experiences: [...s.experiences, newExp] }));
    dbInsertExperience(newExp);
  },

  importStudents: (invId, rows) => {
    const newStudents: Student[] = [];
    const newGuardians: Guardian[] = [];
    const newSlips: PermissionSlip[] = [];

    rows.forEach((row, i) => {
      const sid = `imp-${invId}-${Date.now()}-${i}`;
      newStudents.push({ id: sid, inv: invId, f: row.firstName, l: row.lastName, gr: row.grade });
      newGuardians.push({ sid, name: row.guardianName, phone: row.guardianPhone, email: row.guardianEmail, lang: row.guardianLang });
      newSlips.push({ id: `sl-${sid}`, inv: invId, sid, tok: `tok-${sid}`, status: 'PENDING' });
    });

    set((s) => ({
      students: [...s.students, ...newStudents],
      guardians: [...s.guardians, ...newGuardians],
      slips: [...s.slips, ...newSlips],
    }));
    dbInsertStudents(newStudents, newGuardians, newSlips);
  },

  sendSlip: (slipId) => {
    set((s) => ({
      slips: s.slips.map((sl) =>
        sl.id === slipId && sl.status === 'PENDING' ? { ...sl, status: 'SENT' } : sl,
      ),
    }));
    dbUpdateSlipStatus(slipId, 'SENT');
  },

  sendAllPending: (invId) => {
    const pending = get().slips.filter((sl) => sl.inv === invId && sl.status === 'PENDING');
    set((s) => ({
      slips: s.slips.map((sl) =>
        sl.inv === invId && sl.status === 'PENDING' ? { ...sl, status: 'SENT' } : sl,
      ),
    }));
    if (pending.length > 0) {
      dbUpdateSlipsBatch(pending.map((s) => s.id), 'SENT');
    }
  },

  remindSlip: (slipId) => {
    set((s) => ({
      slips: s.slips.map((sl) =>
        sl.id === slipId && sl.status === 'SENT' ? { ...sl, status: 'OPENED' } : sl,
      ),
    }));
    dbUpdateSlipStatus(slipId, 'OPENED');
  },
}));

// ── Selectors ────────────────────────────────────────────────
export function getExperienceById(id: string, exps: Experience[]) {
  return exps.find((e) => e.id === id);
}

export function getInvsForExperience(expId: string, invs: Invitation[]) {
  return invs.filter((i) => i.expId === expId);
}

export function getStudentsForInv(invId: string, students: Student[]) {
  return students.filter((s) => s.inv === invId);
}

export function getSlipsForInv(invId: string, slips: PermissionSlip[]) {
  return slips.filter((s) => s.inv === invId);
}

export function getGuardian(studentId: string, guardians: Guardian[]) {
  return guardians.find((g) => g.sid === studentId);
}

export function getSlipByToken(token: string, slips: PermissionSlip[]) {
  return slips.find((s) => s.tok === token);
}

export function getStudentById(id: string, students: Student[]) {
  return students.find((s) => s.id === id);
}

export function getInvById(id: string, invs: Invitation[]) {
  return invs.find((i) => i.id === id);
}

export function getPaymentsForSlip(slipId: string, payments: Payment[]) {
  return payments.filter((p) => p.slid === slipId);
}

// ── CSV Parser ───────────────────────────────────────────────
export function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // skip header row
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    return {
      firstName: cols[0] || '',
      lastName: cols[1] || '',
      grade: cols[2] || '',
      guardianName: cols[3] || '',
      guardianPhone: cols[4] || '',
      guardianEmail: cols[5] || '',
      guardianLang: cols[6] || undefined,
    };
  }).filter((r) => r.firstName && r.lastName);
}
