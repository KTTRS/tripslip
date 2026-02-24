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

  // ── Experience List View ──
  if (!selectedExp) {
    return (
      <div className="min-h-screen bg-gray-50/80">
        <Header onHome={() => navigate('/')} />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Experiences
              </h2>
              <p className="text-gray-500 mt-1 text-sm">Select an experience to view details and schools.</p>
            </div>
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
                  className="text-left p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-bus transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge status={status} />
                    <span className="text-[11px] text-gray-400">{exp.date}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">{exp.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">{exp.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{expInvs.length} school{expInvs.length !== 1 ? 's' : ''}</span>
                    <span>{expStudentCount} student{expStudentCount !== 1 ? 's' : ''}</span>
                    {expSlips.length > 0 && (
                      <span className="text-ts-green font-semibold">
                        {expDone}/{expSlips.length} done
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-gray-500">📍 {exp.loc}</div>
                </button>
              );
            })}

            {/* Add experience card */}
            <button
              onClick={() => setShowNewExp(true)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-bus hover:bg-bus/5 transition-all min-h-[200px]"
            >
              <span className="text-4xl mb-3">+</span>
              <span className="font-semibold text-gray-500">New Experience</span>
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
    <div className="min-h-screen bg-gray-50/80">
      <Header onHome={() => navigate('/')} rightAction={
        <Button sz="sm" onClick={() => setShowNewExp(true)}>+ New Experience</Button>
      } />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <button onClick={() => setSelectedExpId(null)} className="text-sm text-gray-400 hover:text-gray-600 font-medium mb-3 inline-flex items-center gap-1">
            ← All Experiences
          </button>
          <Badge status="ACTIVE" />
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-2">{selectedExp.title}</h2>
          <p className="text-gray-500 mt-1 text-sm max-w-xl">{selectedExp.desc}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-gray-500">
            <span>📅 {selectedExp.date}</span>
            <span>🕘 {selectedExp.time}</span>
            <span>📍 {selectedExp.loc}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Schools" value={expInvs.length} sub={`${expInvs.filter((i) => i.status === 'ACTIVE').length} active`} accent="bg-charcoal" />
          <MetricCard label="Students" value={allStudentCount} sub="across all schools" accent="bg-ts-blue" />
          <MetricCard label="Completed" value={done} sub={`of ${allSlips.length} slips`} accent="bg-ts-green" />
          <MetricCard label="Collected" value={`$${(rev / 100).toLocaleString()}`} sub={`${payments.filter((p) => p.ok && p.type === 'REQ').length} payments`} accent="bg-ts-lavender" />
          <MetricCard label="Fund" value={`$${(donations / 100).toLocaleString()}`} sub="TripSlip Field Trip Fund" accent="bg-bus" />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Overall Completion</h3>
            <span className="text-sm text-gray-400">{allSlips.length} slips</span>
          </div>
          <ProgressBar value={done} total={allSlips.length} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            {(
              [
                ['Completed', done, 'bg-ts-green'],
                ['Opened', opened, 'bg-bus'],
                ['Sent', sent, 'bg-ts-blue'],
                ['Pending', pend, 'bg-gray-300'],
              ] as const
            ).map(([label, val, color]) => (
              <span key={label} className="flex items-center gap-2 text-gray-600">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {val} {label}
              </span>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Schools</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  {['School', 'Teacher', 'Status', 'Students', 'Completion', ''].map((h) => (
                    <th key={h} className="px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expInvs.map((iv) => {
                  const invStudents = getStudentsForInv(iv.id, students);
                  const invSlips = getSlipsForInv(iv.id, slips);
                  const invDone = invSlips.filter((s) => s.status === 'COMPLETED').length;
                  return (
                    <tr key={iv.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-gray-900">{iv.school}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{iv.teacher}</p>
                        <p className="text-[11px] text-gray-400">{iv.email}</p>
                      </td>
                      <td className="px-6 py-4"><Badge status={iv.status} /></td>
                      <td className="px-6 py-4 text-sm text-gray-700">{invStudents.length || '—'}</td>
                      <td className="px-6 py-4 w-44">
                        {invStudents.length > 0 ? (
                          <ProgressBar value={invDone} total={invSlips.length} />
                        ) : (
                          <span className="text-xs text-gray-400 italic">Awaiting</span>
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
          <Button v="light" sz="sm" onClick={() => alert('CSV export generated (demo)')}>📤 Export All Data (CSV)</Button>
          <Button v="light" sz="sm" onClick={() => alert('Bulk reminder sent (demo)')}>🔔 Send Bulk Reminder</Button>
          <Button v="light" sz="sm" onClick={() => alert('Report downloading (demo)')}>📊 Download Report</Button>
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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-charcoal flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs">TS</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-gray-900 leading-none">TripSlip</h1>
            <p className="text-[11px] text-gray-400">Junior Achievement of SE Michigan</p>
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">New Experience</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <Input label="Experience Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Stock Market Challenge 2026" />
          <Input label="Description">
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description of the experience" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bus focus:border-transparent text-gray-900 placeholder-gray-400 resize-none" />
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
            <label className="block text-sm font-medium text-gray-700">Permission / Indemnification Document</label>
            <p className="text-xs text-gray-400">Paste the legal text below or upload a .txt file.</p>
            <div className="flex gap-2 mb-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                📎 Upload .txt
                <input type="file" accept=".txt,.doc,.docx" className="hidden" onChange={handleFileUpload} />
              </label>
              {indemnification && <span className="text-xs text-ts-green font-semibold flex items-center">✓ Document loaded</span>}
            </div>
            <textarea
              rows={6}
              value={indemnification}
              onChange={(e) => setIndemnification(e.target.value)}
              placeholder="Paste your Permission, Waiver, and Release of Liability text here..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bus focus:border-transparent text-gray-900 placeholder-gray-400 text-sm resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <Button v="light" onClick={onClose}>Cancel</Button>
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
