import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { MetricCard } from '../components/metric-card';
import { ProgressBar } from '../components/progress-bar';
import {
  EXPERIENCE as EXP,
  INVITATIONS,
  FORM_FIELDS,
  getStudentsForInv,
  getSlipsForInv,
  getGuardian,
  getPaymentsForSlip,
} from '../lib/store';
import type { PermissionSlip } from '../lib/types';

const TABS = ['Dashboard', 'Students', 'Forms', 'Send'] as const;
type Tab = (typeof TABS)[number];

export default function TeacherPage() {
  const { invId } = useParams<{ invId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Dashboard');

  const inv = INVITATIONS.find((i) => i.id === invId) ?? INVITATIONS[0];
  const students = getStudentsForInv(inv.id);
  const slips = getSlipsForInv(inv.id);
  const done = slips.filter((s) => s.status === 'COMPLETED').length;
  const opened = slips.filter((s) => s.status === 'OPENED').length;
  const sent = slips.filter((s) => s.status === 'SENT').length;
  const pending = slips.filter((s) => s.status === 'PENDING').length;

  function getSlipForStudent(sid: string): PermissionSlip | undefined {
    return slips.find((sl) => sl.sid === sid);
  }

  function getPaymentStatus(sid: string): string {
    const slip = getSlipForStudent(sid);
    if (!slip) return '—';
    const payments = getPaymentsForSlip(slip.id);
    const paid = payments.find((p) => p.ok && p.type === 'REQ');
    return paid ? 'PAID' : slip.status === 'COMPLETED' ? 'WAIVED' : 'UNPAID';
  }

  return (
    <div className="min-h-screen bg-mint/40">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-charcoal flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">TS</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-gray-900 leading-none">{inv.school}</h1>
              <p className="text-[11px] text-gray-400">{inv.teacher}</p>
            </div>
          </button>
          <Button v="dark" sz="sm" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </Button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t
                  ? 'border-bus text-charcoal'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ──── Dashboard Tab ──── */}
        {tab === 'Dashboard' && (
          <>
            <div>
              <Badge status={inv.status} />
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-2">{EXP.title}</h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
                <span>📅 {EXP.date}</span>
                <span>🕘 {EXP.time}</span>
                <span>📍 {EXP.loc}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Students" value={students.length} sub="enrolled" accent="bg-charcoal" />
              <MetricCard label="Completed" value={done} sub={`of ${slips.length} slips`} accent="bg-ts-green" />
              <MetricCard label="Opened" value={opened} sub="in progress" accent="bg-bus" />
              <MetricCard label="Pending" value={pending + sent} sub="not started" accent="bg-gray-300" />
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Permission Slip Progress</h3>
                <span className="text-sm text-gray-400">{slips.length} total</span>
              </div>
              <ProgressBar value={done} total={slips.length} />
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                {(
                  [
                    ['Completed', done, 'bg-ts-green'],
                    ['Opened', opened, 'bg-bus'],
                    ['Sent', sent, 'bg-ts-blue'],
                    ['Pending', pending, 'bg-gray-300'],
                  ] as const
                ).map(([label, val, color]) => (
                  <span key={label} className="flex items-center gap-2 text-gray-600">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    {val} {label}
                  </span>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ──── Students Tab ──── */}
        {tab === 'Students' && (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Student Roster</h3>
              <Button v="light" sz="xs">+ Add Student</Button>
            </div>
            {students.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-gray-400 text-sm">No students enrolled yet.</p>
                <Button v="light" sz="sm" className="mt-4">+ Add Students</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                      {['Student', 'Grade', 'Guardian', 'Permission', 'Payment', ''].map((h) => (
                        <th key={h} className="px-6 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((stu) => {
                      const g = getGuardian(stu.id);
                      const slip = getSlipForStudent(stu.id);
                      const payStatus = getPaymentStatus(stu.id);
                      return (
                        <tr key={stu.id} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{stu.f} {stu.l}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{stu.gr}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{g?.name ?? '—'}</p>
                            <p className="text-[11px] text-gray-400">{g?.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            {slip ? <Badge status={slip.status} sm /> : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={payStatus} sm />
                          </td>
                          <td className="px-6 py-4 text-right">
                            {slip && slip.status !== 'COMPLETED' && (
                              <Button v="ghost" sz="xs" className="opacity-0 group-hover:opacity-100">
                                Remind
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ──── Forms Tab ──── */}
        {tab === 'Forms' && (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Form Fields</h3>
              <p className="text-sm text-gray-500 mt-1">
                These fields appear on the parent permission slip.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {FORM_FIELDS.map((field) => {
                if (field.type === 'heading') {
                  return (
                    <div key={field.id} className="pt-4 first:pt-0">
                      <h4 className="text-sm font-bold text-charcoal uppercase tracking-wider">{field.label}</h4>
                      <div className="h-px bg-gray-100 mt-2" />
                    </div>
                  );
                }
                return (
                  <div key={field.id} className="flex items-center justify-between py-2.5 px-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{field.label}</p>
                      <p className="text-xs text-gray-400">
                        Type: {field.type}
                        {field.req && ' · Required'}
                        {field.opts && ` · ${field.opts.length} options`}
                      </p>
                    </div>
                    <Badge status={field.req ? 'REQUIRED' : 'OPTIONAL'} sm />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ──── Send Tab ──── */}
        {tab === 'Send' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-2">Send Permission Slips</h3>
              <p className="text-sm text-gray-500 mb-6">
                Permission slips are sent via SMS to each student's guardian. Links expire after 30 days.
              </p>
              {students.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-8 text-center">
                  Add students first to send permission slips.
                </p>
              ) : (
                <div className="space-y-3">
                  {students.map((stu) => {
                    const g = getGuardian(stu.id);
                    const slip = getSlipForStudent(stu.id);
                    return (
                      <div key={stu.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{stu.f} {stu.l}</p>
                          <p className="text-xs text-gray-400">{g?.name} · {g?.phone}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {slip && <Badge status={slip.status} sm />}
                          {slip?.status === 'PENDING' ? (
                            <Button v="dark" sz="xs">Send</Button>
                          ) : slip?.status === 'SENT' || slip?.status === 'OPENED' ? (
                            <Button v="light" sz="xs">Resend</Button>
                          ) : (
                            <span className="text-xs text-ts-green font-semibold">✓ Done</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button v="dark" sz="sm">📤 Send All Pending</Button>
              <Button v="light" sz="sm">🔔 Remind All Unsigned</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
