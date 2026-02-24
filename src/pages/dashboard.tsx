import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { MetricCard } from '../components/metric-card';
import { ProgressBar } from '../components/progress-bar';
import {
  EXPERIENCE as EXP,
  INVITATIONS,
  STUDENTS,
  SLIPS,
  PAYMENTS,
  getStudentsForInv,
  getSlipsForInv,
} from '../lib/store';

export default function DashboardPage() {
  const navigate = useNavigate();

  const done = SLIPS.filter((s) => s.status === 'COMPLETED').length;
  const opened = SLIPS.filter((s) => s.status === 'OPENED').length;
  const sent = SLIPS.filter((s) => s.status === 'SENT').length;
  const pend = SLIPS.filter((s) => s.status === 'PENDING').length;
  const rev = PAYMENTS.filter((p) => p.ok && p.type === 'REQ').reduce((a, p) => a + p.cents, 0);
  const donations = PAYMENTS.filter((p) => p.ok && p.type === 'DON').reduce((a, p) => a + p.cents, 0);

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-charcoal flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">TS</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-gray-900 leading-none">TripSlip</h1>
              <p className="text-[11px] text-gray-400">Junior Achievement of SE Michigan</p>
            </div>
          </button>
          <Button sz="sm">+ New Experience</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Experience header */}
        <div>
          <Badge status="ACTIVE" />
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-2">
            {EXP.title}
          </h2>
          <p className="text-gray-500 mt-1 text-sm max-w-xl">{EXP.desc}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-gray-500">
            <span>📅 {EXP.date}</span>
            <span>🕘 {EXP.time}</span>
            <span>📍 {EXP.loc}</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Schools"
            value={INVITATIONS.length}
            sub={`${INVITATIONS.filter((i) => i.status === 'ACTIVE').length} active`}
            accent="bg-charcoal"
          />
          <MetricCard
            label="Students"
            value={STUDENTS.length}
            sub="across all schools"
            accent="bg-ts-blue"
          />
          <MetricCard
            label="Completed"
            value={done}
            sub={`of ${SLIPS.length} slips`}
            accent="bg-ts-green"
          />
          <MetricCard
            label="Collected"
            value={`$${(rev / 100).toLocaleString()}`}
            sub={`${PAYMENTS.filter((p) => p.ok && p.type === 'REQ').length} payments`}
            accent="bg-ts-lavender"
          />
          <MetricCard
            label="Fund"
            value={`$${(donations / 100).toLocaleString()}`}
            sub="TripSlip Field Trip Fund"
            accent="bg-bus"
          />
        </div>

        {/* Overall Completion */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Overall Completion</h3>
            <span className="text-sm text-gray-400">{SLIPS.length} slips</span>
          </div>
          <ProgressBar value={done} total={SLIPS.length} />
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

        {/* Schools table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Schools</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  {['School', 'Teacher', 'Status', 'Students', 'Completion', ''].map((h) => (
                    <th key={h} className="px-6 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {INVITATIONS.map((iv) => {
                  const invStudents = getStudentsForInv(iv.id);
                  const invSlips = getSlipsForInv(iv.id);
                  const invDone = invSlips.filter((s) => s.status === 'COMPLETED').length;

                  return (
                    <tr
                      key={iv.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">{iv.school}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{iv.teacher}</p>
                        <p className="text-[11px] text-gray-400">{iv.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={iv.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {invStudents.length || '—'}
                      </td>
                      <td className="px-6 py-4 w-44">
                        {invStudents.length > 0 ? (
                          <ProgressBar value={invDone} total={invSlips.length} />
                        ) : (
                          <span className="text-xs text-gray-400 italic">Awaiting</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          v="ghost"
                          sz="xs"
                          onClick={() => navigate(`/t/${iv.id}`)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          View →
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button v="light" sz="sm">
            📤 Export All Data (CSV)
          </Button>
          <Button v="light" sz="sm">
            🔔 Send Bulk Reminder
          </Button>
          <Button v="light" sz="sm">
            📊 Download Report
          </Button>
        </div>
      </main>
    </div>
  );
}
