import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { MetricCard } from '../components/metric-card';
import { ProgressBar } from '../components/progress-bar';
import {
  useStore,
  FORM_FIELDS,
  getStudentsForInv,
  getSlipsForInv,
  getGuardian,
  getPaymentsForSlip,
  getExperienceById,
  parseCSV,
} from '../lib/store';
import type { PermissionSlip, ImportRow } from '../lib/types';

const TABS = ['Dashboard', 'Students', 'Forms', 'Send'] as const;
type Tab = (typeof TABS)[number];

export default function TeacherPage() {
  const { invId } = useParams<{ invId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Dashboard');
  const [showImport, setShowImport] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const {
    experiences, invitations, students, guardians, slips, payments,
    importStudents, sendSlip, sendAllPending, remindSlip,
  } = useStore();

  const inv = invitations.find((i) => i.id === invId) ?? invitations[0];
  const exp = getExperienceById(inv.expId, experiences);
  const stuList = getStudentsForInv(inv.id, students);
  const slipList = getSlipsForInv(inv.id, slips);
  const done = slipList.filter((s) => s.status === 'COMPLETED').length;
  const opened = slipList.filter((s) => s.status === 'OPENED').length;
  const sent = slipList.filter((s) => s.status === 'SENT').length;
  const pending = slipList.filter((s) => s.status === 'PENDING').length;

  function getSlipForStudent(sid: string): PermissionSlip | undefined {
    return slipList.find((sl) => sl.sid === sid);
  }

  function getPaymentStatus(sid: string): string {
    const slip = getSlipForStudent(sid);
    if (!slip) return '—';
    const pays = getPaymentsForSlip(slip.id, payments);
    const paid = pays.find((p) => p.ok && p.type === 'REQ');
    return paid ? 'PAID' : slip.status === 'COMPLETED' ? 'WAIVED' : 'UNPAID';
  }

  return (
    <div className="min-h-screen bg-mint/40">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-charcoal flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">TS</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-gray-900 leading-none">{inv.school}</h1>
              <p className="text-[11px] text-gray-400">{inv.teacher}</p>
            </div>
          </button>
          <Button v="dark" sz="sm" onClick={() => navigate('/dashboard')}>← Dashboard</Button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t ? 'border-bus text-charcoal' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Dashboard Tab */}
        {tab === 'Dashboard' && (
          <>
            <div>
              <Badge status={inv.status} />
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-2">{exp?.title ?? 'Experience'}</h2>
              {exp && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
                  <span>📅 {exp.date}</span>
                  <span>🕘 {exp.time}</span>
                  <span>📍 {exp.loc}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Students" value={stuList.length} sub="enrolled" accent="bg-charcoal" />
              <MetricCard label="Completed" value={done} sub={`of ${slipList.length} slips`} accent="bg-ts-green" />
              <MetricCard label="Opened" value={opened} sub="in progress" accent="bg-bus" />
              <MetricCard label="Pending" value={pending + sent} sub="not started" accent="bg-gray-300" />
            </div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Permission Slip Progress</h3>
                <span className="text-sm text-gray-400">{slipList.length} total</span>
              </div>
              <ProgressBar value={done} total={slipList.length} />
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                {([
                  ['Completed', done, 'bg-ts-green'],
                  ['Opened', opened, 'bg-bus'],
                  ['Sent', sent, 'bg-ts-blue'],
                  ['Pending', pending, 'bg-gray-300'],
                ] as const).map(([label, val, color]) => (
                  <span key={label} className="flex items-center gap-2 text-gray-600">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    {val} {label}
                  </span>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Students Tab */}
        {tab === 'Students' && (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-bold text-gray-900">Student Roster</h3>
                <div className="flex gap-2">
                  <Button v="accent" sz="xs" onClick={() => setShowImport(true)}>📎 Import CSV</Button>
                  <Button v="light" sz="xs" onClick={() => alert('ClassDojo integration coming soon!\nShare link: tripslip.org/join/' + inv.id)}>
                    🔗 ClassDojo / Remind
                  </Button>
                </div>
              </div>

              {stuList.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-3xl mb-4">📋</p>
                  <p className="text-gray-500 font-medium mb-1">No students yet</p>
                  <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                    Import a CSV file with student and parent info, or share a link via ClassDojo / Remind.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button v="accent" sz="sm" onClick={() => setShowImport(true)}>📎 Import CSV</Button>
                    <Button v="light" sz="sm" onClick={() => alert('Share link: tripslip.org/join/' + inv.id)}>🔗 Share Link</Button>
                  </div>
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
                      {stuList.map((stu) => {
                        const g = getGuardian(stu.id, guardians);
                        const slip = getSlipForStudent(stu.id);
                        const payStatus = getPaymentStatus(stu.id);
                        const isExpanded = expandedStudent === stu.id;
                        return (
                          <tr key={stu.id} className="group">
                            <td className="px-6 py-4">
                              <button onClick={() => setExpandedStudent(isExpanded ? null : stu.id)} className="text-left">
                                <p className="font-semibold text-gray-900 hover:text-ts-blue transition-colors">
                                  {stu.f} {stu.l}
                                  <span className="text-gray-400 ml-1 text-xs">{isExpanded ? '▾' : '▸'}</span>
                                </p>
                                {isExpanded && g && (
                                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                                    <p><span className="font-semibold text-gray-500">Guardian:</span> {g.name}</p>
                                    <p><span className="font-semibold text-gray-500">Phone:</span> {g.phone}</p>
                                    <p><span className="font-semibold text-gray-500">Email:</span> {g.email}</p>
                                    {g.lang && g.lang !== 'en' && (
                                      <p><span className="font-semibold text-gray-500">Language:</span> {g.lang.toUpperCase()}</p>
                                    )}
                                  </div>
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{stu.gr}</td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-700">{g?.name ?? '—'}</p>
                              <p className="text-[11px] text-gray-400">{g?.phone}</p>
                            </td>
                            <td className="px-6 py-4">
                              {slip ? <Badge status={slip.status} sm /> : <span className="text-xs text-gray-400">—</span>}
                            </td>
                            <td className="px-6 py-4"><Badge status={payStatus} sm /></td>
                            <td className="px-6 py-4 text-right">
                              {slip && slip.status !== 'COMPLETED' && (
                                <Button
                                  v="ghost" sz="xs"
                                  className="opacity-0 group-hover:opacity-100"
                                  onClick={() => {
                                    if (slip.status === 'SENT') remindSlip(slip.id);
                                    else alert('Action sent (demo)');
                                  }}
                                >
                                  {slip.status === 'SENT' ? 'Remind' : 'Action'}
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
            <div className="text-xs text-gray-400">
              <p className="font-semibold mb-1">CSV Format:</p>
              <code className="bg-gray-100 px-3 py-1.5 rounded-lg block overflow-x-auto">
                First Name, Last Name, Grade, Parent Name, Parent Phone, Parent Email
              </code>
            </div>
          </div>
        )}

        {/* Forms Tab */}
        {tab === 'Forms' && (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Form Fields</h3>
              <p className="text-sm text-gray-500 mt-1">These fields appear on the parent permission slip.</p>
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
                      <p className="text-xs text-gray-400">Type: {field.type}{field.req && ' · Required'}{field.opts && ` · ${field.opts.length} options`}</p>
                    </div>
                    <Badge status={field.req ? 'REQUIRED' : 'OPTIONAL'} sm />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Send Tab */}
        {tab === 'Send' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-2">Send Permission Slips</h3>
              <p className="text-sm text-gray-500 mb-6">Permission slips are sent via SMS to each student's guardian. Links expire after 30 days.</p>
              {stuList.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-8 text-center">Add students first to send permission slips.</p>
              ) : (
                <div className="space-y-3">
                  {stuList.map((stu) => {
                    const g = getGuardian(stu.id, guardians);
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
                            <Button v="dark" sz="xs" onClick={() => sendSlip(slip.id)}>Send</Button>
                          ) : slip?.status === 'SENT' ? (
                            <Button v="light" sz="xs" onClick={() => remindSlip(slip.id)}>Remind</Button>
                          ) : slip?.status === 'OPENED' ? (
                            <Button v="light" sz="xs" onClick={() => alert('Reminder sent (demo)')}>Nudge</Button>
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
              <Button v="dark" sz="sm" onClick={() => sendAllPending(inv.id)}>📤 Send All Pending ({pending})</Button>
              <Button v="light" sz="sm" onClick={() => alert('Reminders sent to all unsigned (demo)')}>🔔 Remind All Unsigned</Button>
            </div>
          </div>
        )}
      </main>

      {showImport && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onImport={(rows) => {
            importStudents(inv.id, rows);
            setShowImport(false);
            setTab('Students');
          }}
        />
      )}
    </div>
  );
}

function CSVImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (rows: ImportRow[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState<ImportRow[]>([]);

  void fileRef; // suppress unused warning

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setCsvText(text);
      setParsed(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handlePaste = (text: string) => {
    setCsvText(text);
    setParsed(parseCSV(text));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">Import Students</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-gray-500">Upload a CSV file or paste the data below. Expected columns:</p>
          <code className="block bg-gray-100 px-4 py-2 rounded-xl text-xs text-gray-600 overflow-x-auto">
            First Name, Last Name, Grade, Parent Name, Parent Phone, Parent Email
          </code>

          <div className="flex gap-3">
            <label className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-charcoal text-white rounded-xl cursor-pointer hover:bg-charcoal/90 transition-colors">
              📎 Choose CSV File
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </label>
            <span className="text-sm text-gray-400 self-center">or paste below</span>
          </div>

          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => handlePaste(e.target.value)}
            placeholder={`First Name, Last Name, Grade, Parent Name, Parent Phone, Parent Email\nJohn, Smith, 10, Jane Smith, +13135551234, jane@email.com\nMaria, Garcia, 10, Carlos Garcia, +13135555678, carlos@email.com`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bus focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-mono resize-none"
          />

          {parsed.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Preview ({parsed.length} student{parsed.length !== 1 ? 's' : ''})</p>
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase border-b border-gray-50">
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">Grade</th>
                      <th className="px-4 py-2">Guardian</th>
                      <th className="px-4 py-2">Phone</th>
                      <th className="px-4 py-2">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parsed.map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-medium text-gray-900">{row.firstName} {row.lastName}</td>
                        <td className="px-4 py-2 text-gray-600">{row.grade}</td>
                        <td className="px-4 py-2 text-gray-600">{row.guardianName}</td>
                        <td className="px-4 py-2 text-gray-500">{row.guardianPhone}</td>
                        <td className="px-4 py-2 text-gray-500">{row.guardianEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <Button v="light" onClick={onClose}>Cancel</Button>
          <Button disabled={parsed.length === 0} onClick={() => onImport(parsed)}>
            Import {parsed.length} Student{parsed.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
