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
} from './types';

// ── Legal Documents ──────────────────────────────────────────
export const INDEMNIFICATION = `PERMISSION, WAIVER, AND RELEASE OF LIABILITY

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

// ── Demo Data ────────────────────────────────────────────────
export const EXPERIENCE: Experience = {
  title: 'Stock Market Challenge 2026',
  desc: '6-week experiential program — student teams manage virtual portfolios competing across Detroit schools.',
  date: 'March 15, 2026',
  time: '9:00 AM – 2:30 PM',
  loc: 'JA Finance Park, Detroit',
  cents: 1500,
  payDesc: 'Bus transportation fee',
  donMsg: 'Every dollar goes directly to the TripSlip Field Trip Fund — ensuring no student misses out because of cost.',
};

export const INVITATIONS: Invitation[] = [
  { id: 'i0', school: 'Cass Tech', teacher: 'Ms. Rodriguez', email: 'rodriguez@cass.dpscd.org', status: 'ACTIVE' },
  { id: 'i1', school: 'DPSCD Virtual', teacher: 'Mr. Thompson', email: 'thompson@virtual.dpscd.org', status: 'ACTIVE' },
  { id: 'i2', school: 'Southeastern', teacher: 'Mrs. Williams', email: 'williams@se.dpscd.org', status: 'ACTIVE' },
  { id: 'i3', school: 'Renaissance', teacher: 'Mr. Davis', email: 'davis@ren.dpscd.org', status: 'SENT' },
  { id: 'i4', school: 'Henry Ford Academy', teacher: 'Ms. Chen', email: 'chen@hfa.edu', status: 'SENT' },
  { id: 'i5', school: 'Marygrove / CMA', teacher: 'Mrs. Johnson', email: 'johnson@marygrove.edu', status: 'PENDING' },
];

export const STUDENTS: Student[] = [
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

export const GUARDIANS: Guardian[] = [
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

export const SLIPS: PermissionSlip[] = STUDENTS.map((s, i) => {
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

export const PAYMENTS: Payment[] = [
  { slid: 'sl-s0', type: 'REQ', cents: 1500, ok: true },
  { slid: 'sl-s0', type: 'DON', cents: 2500, ok: true },
  { slid: 'sl-s1', type: 'REQ', cents: 1500, ok: true },
  { slid: 'sl-s2', type: 'REQ', cents: 1500, ok: true },
  { slid: 'sl-s3', type: 'REQ', cents: 1500, ok: false },
  { slid: 'sl-x0', type: 'REQ', cents: 1500, ok: true },
  { slid: 'sl-x1', type: 'REQ', cents: 1500, ok: true },
];

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
    label:
      'I have read and agree to the Permission, Waiver, and Release of Liability above. I give permission for my student to participate in the JA Stock Market Challenge, including transportation.',
    req: true,
  },
  {
    id: 'f17',
    type: 'chk',
    label: 'I authorize JA to use photos/videos of my student for educational and promotional purposes. (Optional)',
  },
];

// ── Zustand Store ────────────────────────────────────────────
interface AppState {
  view: 'home' | 'ja' | 'teach' | 'parent';
  selectedInv: Invitation | null;
  selectedToken: string | null;

  setView: (v: AppState['view']) => void;
  openTeacher: (inv: Invitation) => void;
  openParent: (token: string) => void;
  goHome: () => void;
  goJa: () => void;
}

export const useStore = create<AppState>((set) => ({
  view: 'home',
  selectedInv: null,
  selectedToken: null,

  setView: (v) => set({ view: v }),
  openTeacher: (inv) => set({ view: 'teach', selectedInv: inv }),
  openParent: (token) => set({ view: 'parent', selectedToken: token }),
  goHome: () => set({ view: 'home', selectedInv: null, selectedToken: null }),
  goJa: () => set({ view: 'ja', selectedInv: null, selectedToken: null }),
}));

// ── Helpers ──────────────────────────────────────────────────
export function getStudentsForInv(invId: string) {
  return STUDENTS.filter((s) => s.inv === invId);
}

export function getSlipsForInv(invId: string) {
  return SLIPS.filter((s) => s.inv === invId);
}

export function getGuardian(studentId: string) {
  return GUARDIANS.find((g) => g.sid === studentId);
}

export function getSlipByToken(token: string) {
  return SLIPS.find((s) => s.tok === token);
}

export function getStudentById(id: string) {
  return STUDENTS.find((s) => s.id === id);
}

export function getInvById(id: string) {
  return INVITATIONS.find((i) => i.id === id);
}

export function getPaymentsForSlip(slipId: string) {
  return PAYMENTS.filter((p) => p.slid === slipId);
}

export function getCompletedCount() {
  return SLIPS.filter((s) => s.status === 'COMPLETED').length;
}

export function getRevenueCents() {
  return PAYMENTS.filter((p) => p.ok && p.type === 'REQ').reduce((a, p) => a + p.cents, 0);
}

export function getDonationCents() {
  return PAYMENTS.filter((p) => p.ok && p.type === 'DON').reduce((a, p) => a + p.cents, 0);
}
