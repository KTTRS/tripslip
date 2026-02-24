import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { MetricCard } from '../components/metric-card';
import { ProgressBar } from '../components/progress-bar';
import {
  useStore,
  getInvsForExperience,
  getStudentsForInv,
  getSlipsForInv,
} from '../lib/store';
import type { Experience } from '../lib/types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { experiences, invitations, students, slips, payments, addExperience } = useStore();
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [showNewExp, setShowNewExp] = useState(false);

  const selectedExp = selectedExpId ? experiences.find((e) => e.id === selectedExpId) : null;

  // ── Aggregate stats ──
  const totalStudents = students.length;
  const totalSlips = slips.length;
  const totalDone = slips.filter((s) => s.status === 'COMPLETED').length;
  const totalRev = payments.filter((p) => p.ok && p.type === 'REQ').reduce((a, p) => a + p.cents, 0);
  const totalDon = payments.filter((p) => p.ok && p.type === 'DON').reduce((a, p) => a + p.cents, 0);

  // ── Experience List View ──
  if (!selectedExp) {
    return (
      <div className="min-h-screen bg-white">
        <Header onHome={() => navigate('/')} />

        {/* Yellow hero band with aggregate stats */}
        <div className="bg-bus">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
              Dashboard
            </h2>
            <p className="text-black/50 mt-1 text-sm font-medium">All experiences at a glance</p>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
              <div className="bg-black rounded-xl p-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Experiences</p>
                <p className="text-2xl font-black text-bus mt-1">{experiences.length}</p>
              </div>
              <div className="bg-black rounded-xl p-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Students</p>
                <p className="text-2xl font-black text-white mt-1">{totalStudents}</p>
              </div>
              <div className="bg-black rounded-xl p-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Completed</p>
                <p className="text-2xl font-black text-ts-green mt-1">{totalDone}<span className="text-white/30 text-sm">/{totalSlips}</span></p>
              </div>
              <div className="bg-black rounded-xl p-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Collected</p>
                <p className="text-2xl font-black text-white mt-1">${(totalRev / 100).toLocaleString()}</p>
              </div>
              <div className="bg-black rounded-xl p-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fund</p>
                <p className="text-2xl font-black text-bus mt-1">${(totalDon / 100).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-black">Experiences</h3>
            <Button onClick={() => setShowNewExp(true)}>+ New Experience</Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {experiences.map((exp) => {
              const expInvs = getInvsForExperience(exp.id, invitations);
              const expStudentCount = expInvs.reduce(
                (acc, inv) => acc + getStudentsForInv(inv.id, students).length, 0,
              );
              const expSlips = expInvs.flatMap((inv) => getSlipsForInv(inv.id, slips));
              const expDone = expSlips.filter((s) => s.status === 'COMPLETED').length;
              const hasActive = expInvs.some((i) => i.status === 'ACTIVE');
              const status = expInvs.length === 0 ? 'DRAFT' : hasActive ? 'ACTIVE' : 'SENT';

              return (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExpId(exp.id)}
                  className="text-left p-6 bg-white rounded-2xl border-2 border-black/8 hover:border-bus transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge status={status} />
                    <span className="text-[11px] text-black/30 font-semibold">{exp.date}</span>
                  </div>
                  <h3 className="font-black text-black mb-1 text-lg">{exp.title}</h3>
                  <p className="text-sm text-black/50 leading-relaxed mb-4 line-clamp-2">{exp.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-black/30 font-semibold">
                    <span>{expInvs.length} school{expInvs.length !== 1 ? 's' : ''}</span>
                    <span>{expStudentCount} student{expStudentCount !== 1 ? 's' : ''}</span>
                    {expSlips.length > 0 && (
                      <span className="text-ts-green font-bold">
                        {expDone}/{expSlips.length} done
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-black/40 font-medium">📍 {exp.loc}</div>
                </button>
              );
            })}

            {/* Add experience card */}
            <button
              onClick={() => setShowNewExp(true)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-bus/50 hover:border-bus hover:bg-bus/5 transition-all min-h-[200px]"
            >
              <span className="text-4xl mb-3 text-bus">+</span>
              <span className="font-black text-black/40">New Experience</span>
            </button>
          </div>
        </main>

        {showNewExp && (
          <NewExperienceModal
            onClose={() => setShowNewExp(false)}
            onCreate={(exp) => { addExperience(exp); setShowNewExp(false); }}
          />
        )}
      </div>
    );
  }

  // ── Experience Detail View ──
  const expInvs = getInvsForExperience(selectedExp.id, invitations);
  const allSlips = expInvs.flatMap((inv) => getSlipsForInv(inv.id, slips));
  const allStudentCount = expInvs.reduce(
    (acc, inv) => acc + getStudentsForInv(inv.id, students).length, 0,
  );
  const done = allSlips.filter((s) => s.status === 'COMPLETED').length;
  const opened = allSlips.filter((s) => s.status === 'OPENED').length;
  const sent = allSlips.filter((s) => s.status === 'SENT').length;
  const pend = allSlips.filter((s) => s.status === 'PENDING').length;
  const rev = payments.filter((p) => p.ok && p.type === 'REQ').reduce((a, p) => a + p.cents, 0);
  const donations = payments.filter((p) => p.ok && p.type === 'DON').reduce((a, p) => a + p.cents, 0);

  return (
    <div className="min-h-screen bg-white">
      <Header onHome={() => navigate('/')} rightAction={
        <Button sz="sm" onClick={() => setShowNewExp(true)}>+ New Experience</Button>
      } />

      {/* Black detail hero */}
      <div className="bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <button onClick={() => setSelectedExpId(null)} className="text-sm text-bus hover:text-bus-dark font-bold mb-3 inline-flex items-center gap-1">
            ← All Experiences
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Badge status="ACTIVE" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{selectedExp.title}</h2>
          <p className="text-white/40 mt-1 text-sm max-w-xl">{selectedExp.desc}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-white/50 font-medium">
            <span>📅 {selectedExp.date}</span>
            <span>🕘 {selectedExp.time}</span>
            <span>📍 {selectedExp.loc}</span>
          </div>
        </div>
      </div>
      <div className="bg-bus h-1" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Schools" value={expInvs.length} sub={`${expInvs.filter((i) => i.status === 'ACTIVE').length} active`} accent="bg-black" />
          <MetricCard label="Students" value={allStudentCount} sub="across all schools" accent="bg-ts-blue" />
          <MetricCard label="Completed" value={done} sub={`of ${allSlips.length} slips`} accent="bg-ts-green" />
          <MetricCard label="Collected" value={`$${(rev / 100).toLocaleString()}`} sub={`${payments.filter((p) => p.ok && p.type === 'REQ').length} payments`} accent="bg-ts-lavender" />
          <MetricCard label="Fund" value={`$${(donations / 100).toLocaleString()}`} sub="TripSlip Field Trip Fund" accent="bg-bus" />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-black">Overall Completion</h3>
            <span className="text-sm text-black/30 font-semibold">{allSlips.length} slips</span>
          </div>
          <ProgressBar value={done} total={allSlips.length} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            {([
              ['Completed', done, 'bg-ts-green'],
              ['Opened', opened, 'bg-bus'],
              ['Sent', sent, 'bg-black'],
              ['Pending', pend, 'bg-black/20'],
            ] as const).map(([label, val, color]) => (
              <span key={label} className="flex items-center gap-2 text-black/60 font-medium">
                <span className={`w-3 h-3 rounded-full ${color}`} />
                {val} {label}
              </span>
            ))}
          </div>
        </Card>

        {/* Schools table */}
        <Card className="overflow-hidden">
          <div className="bg-black px-6 py-4 rounded-t-2xl">
            <h3 className="font-black text-white">Schools</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] font-bold text-black/40 uppercase tracking-wider border-b border-black/8">
                  {['School', 'Teacher', 'Status', 'Students', 'Completion', ''].map((h) => (
                    <th key={h} className="px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {expInvs.map((iv) => {
                  const invStudents = getStudentsForInv(iv.id, students);
                  const invSlips = getSlipsForInv(iv.id, slips);
                  const invDone = invSlips.filter((s) => s.status === 'COMPLETED').length;
                  return (
                    <tr key={iv.id} className="hover:bg-bus/5 transition-colors group">
                      <td className="px-6 py-4 font-bold text-black">{iv.school}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-black/70 font-medium">{iv.teacher}</p>
                        <p className="text-[11px] text-black/30">{iv.email}</p>
                      </td>
                      <td className="px-6 py-4"><Badge status={iv.status} /></td>
                      <td className="px-6 py-4 text-sm text-black/70 font-semibold">{invStudents.length || '—'}</td>
                      <td className="px-6 py-4 w-44">
                        {invStudents.length > 0 ? (
                          <ProgressBar value={invDone} total={invSlips.length} />
                        ) : (
                          <span className="text-xs text-black/30 italic font-medium">Awaiting</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button v="ghost" sz="xs" onClick={() => navigate(`/t/${iv.id}`)} className="opacity-0 group-hover:opacity-100">View →</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button v="outline" sz="sm" onClick={() => alert('CSV export generated (demo)')}>📤 Export All Data</Button>
          <Button v="outline" sz="sm" onClick={() => alert('Bulk reminder sent (demo)')}>🔔 Send Bulk Reminder</Button>
          <Button v="outline" sz="sm" onClick={() => alert('Report downloading (demo)')}>📊 Download Report</Button>
        </div>
      </main>

      {showNewExp && (
        <NewExperienceModal
          onClose={() => setShowNewExp(false)}
          onCreate={(exp) => { addExperience(exp); setShowNewExp(false); }}
        />
      )}
    </div>
  );
}

function Header({ onHome, rightAction }: { onHome: () => void; rightAction?: React.ReactNode }) {
  return (
    <header className="bg-black sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-bus flex items-center justify-center shadow-sm rotate-[-4deg]">
            <span className="text-sm">🎫</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-black text-white leading-none italic">tripslip</h1>
            <p className="text-[11px] text-white/40 font-medium">Junior Achievement of SE Michigan</p>
          </div>
        </button>
        {rightAction}
      </div>
    </header>
  );
}

function NewExperienceModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (exp: Omit<Experience, 'id'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loc, setLoc] = useState('');
  const [cost, setCost] = useState('');
  const [payDesc, setPayDesc] = useState('');
  const [donMsg, setDonMsg] = useState('');
  const [indemnification, setIndemnification] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setIndemnification(reader.result as string);
    reader.readAsText(file);
  };

  const canCreate = title.trim() && date.trim() && cost.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border-2 border-black/10">
        <div className="px-6 py-5 bg-black rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-black text-white">New Experience</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <Input label="Experience Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Stock Market Challenge 2026" />
          <Input label="Description">
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description of the experience" className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-bus focus:ring-2 focus:ring-bus/30 text-black placeholder-black/30 resize-none font-medium" />
          </Input>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 9:00 AM – 2:30 PM" />
          </div>
          <Input label="Location" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. JA Finance Park, Detroit" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cost (cents)" required type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="1500 = $15.00" />
            <Input label="Payment Description" value={payDesc} onChange={(e) => setPayDesc(e.target.value)} placeholder="e.g. Bus transportation fee" />
          </div>
          <Input label="Donation Message" value={donMsg} onChange={(e) => setDonMsg(e.target.value)} placeholder="Optional message encouraging donations" />

          <div className="space-y-2">
            <label className="block text-sm font-bold text-black">Permission / Indemnification Document</label>
            <p className="text-xs text-black/40 font-medium">Paste the legal text below or upload a .txt file.</p>
            <div className="flex gap-2 mb-2">
              <label className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-black text-white rounded-xl cursor-pointer hover:bg-black/85 transition-colors">
                📎 Upload .txt
                <input type="file" accept=".txt,.doc,.docx" className="hidden" onChange={handleFileUpload} />
              </label>
              {indemnification && <span className="text-xs text-ts-green font-bold flex items-center">✓ Document loaded</span>}
            </div>
            <textarea
              rows={6}
              value={indemnification}
              onChange={(e) => setIndemnification(e.target.value)}
              placeholder="Paste your Permission, Waiver, and Release of Liability text here..."
              className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-bus focus:ring-2 focus:ring-bus/30 text-black placeholder-black/30 text-sm resize-none font-medium"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t-2 border-black/8 flex justify-end gap-3">
          <Button v="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!canCreate} onClick={() => onCreate({
            title: title.trim(), desc: desc.trim(), date: date.trim(), time: time.trim(),
            loc: loc.trim(), cents: parseInt(cost) || 0, payDesc: payDesc.trim(),
            donMsg: donMsg.trim(), indemnification: indemnification.trim(),
          })}>Create Experience</Button>
        </div>
      </div>
    </div>
  );
}
