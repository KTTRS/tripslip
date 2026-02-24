import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { DocumentViewer } from '../components/document-viewer';
import { SignaturePad } from '../components/signature-pad';
import {
  useStore,
  SCHOOL_ADDENDUMS,
  FORM_FIELDS,
  getSlipByToken,
  getStudentById,
  getGuardian,
  getInvById,
  getExperienceById,
} from '../lib/store';
import type { PaymentOption } from '../lib/types';

/* ── Payment method definitions ───────────────────────────── */
const PAY_METHODS = [
  { id: 'card', label: 'Debit / Credit Card', icon: '💳' },
  { id: 'cashapp', label: 'Cash App', icon: '💵' },
  { id: 'venmo', label: 'Venmo', icon: '✌️' },
  { id: 'zelle', label: 'Zelle', icon: '⚡' },
  { id: 'chime', label: 'Chime', icon: '🔔' },
  { id: 'applepay', label: 'Apple Pay', icon: '🍎' },
  { id: 'googlepay', label: 'Google Pay', icon: '🔷' },
] as const;

type PayMethod = (typeof PAY_METHODS)[number]['id'];

export default function ParentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);

  const { experiences, invitations, students: allStudents, guardians: allGuardians, slips: allSlips, completeSlip } = useStore();

  // ── Data lookup ──
  const slip = getSlipByToken(token ?? '', allSlips);
  const student = slip ? getStudentById(slip.sid, allStudents) : undefined;
  const guardian = student ? getGuardian(student.id, allGuardians) : undefined;
  const inv = slip ? getInvById(slip.inv, invitations) : undefined;
  const exp = inv ? getExperienceById(inv.expId, experiences) : undefined;
  const addendum = inv ? SCHOOL_ADDENDUMS[inv.id] : undefined;

  // ── Form state ──
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [sigOk, setSigOk] = useState(false);
  const [payOpt, setPayOpt] = useState<PaymentOption>('full');
  const [payMethod, setPayMethod] = useState<PayMethod>('card');
  const [partialAmt, setPartialAmt] = useState('');
  const [donAmt, setDonAmt] = useState('');
  const [addSchoolChk, setAddSchoolChk] = useState(false);

  // Switch language based on guardian preference
  useEffect(() => {
    if (guardian?.lang) {
      i18n.changeLanguage(guardian.lang);
    }
  }, [guardian, i18n]);

  // Pre-populate fields from student/guardian
  useEffect(() => {
    if (!student || !guardian) return;
    const pre: Record<string, string> = {};
    for (const f of FORM_FIELDS) {
      if (f.pre === 'stu') pre[f.id] = `${student.f} ${student.l}`;
      else if (f.pre === 'gr') pre[f.id] = student.gr;
      else if (f.pre === 'gN') pre[f.id] = guardian.name;
      else if (f.pre === 'gP') pre[f.id] = guardian.phone;
      else if (f.pre === 'gE') pre[f.id] = guardian.email;
    }
    setFormData(pre);
  }, [student, guardian]);

  // ── Not found ──
  if (!slip || !student || !guardian || !inv || !exp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-bus rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-[-4deg]">
            <span className="text-2xl">🎫</span>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Link not found</h2>
          <p className="text-white/50 mb-6 text-sm font-medium">This permission slip link is invalid or expired.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const costDollars = (exp.cents / 100).toFixed(2);
  const stuName = `${student.f} ${student.l}`;

  const setField = (id: string, val: string) =>
    setFormData((prev) => ({ ...prev, [id]: val }));
  const toggleCheck = (id: string) =>
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Validation ──
  const formValid = FORM_FIELDS
    .filter((f) => f.req && f.type !== 'heading' && f.type !== 'doc')
    .every((f) => (f.type === 'chk' ? checks[f.id] : formData[f.id]?.trim()));
  const schoolValid = addendum ? addSchoolChk : true;
  const sigConfirms = ['c1', 'c2', 'c3', 'c4'];
  const sigValid = sigConfirms.every((c) => checks[c]) && sigOk;

  const steps = [t('permissionSlipFor'), t('signPermissionSlip'), t('payment')];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Sticky header + progress ── */}
      {step < 3 && (
        <div className="sticky top-0 z-30">
          <div className="bg-black">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-bus flex items-center justify-center rotate-[-4deg]">
                  <span className="text-[10px]">🎫</span>
                </div>
                <span className="text-xs font-bold text-white/60">{steps[step]}</span>
              </div>
              <div className="flex gap-1">
                {['en', 'es', 'ar'].map((lng) => (
                  <button
                    key={lng}
                    onClick={() => i18n.changeLanguage(lng)}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-colors ${
                      i18n.language === lng
                        ? 'bg-bus text-black'
                        : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    {lng.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Bold yellow progress bar */}
          <div className="h-1.5 bg-black/10">
            <div
              className="h-full bg-bus transition-all duration-500"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* ═══════════ STEP 0: FORM ═══════════ */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-black tracking-tight">
                {t('permissionSlipFor')}
              </h2>
              <p className="text-lg font-black text-bus mt-1">{stuName}</p>
            </div>

            {/* Experience card */}
            <Card dark className="p-5">
              <h3 className="font-black text-bus mb-2">{exp.title}</h3>
              <div className="space-y-1 text-sm text-white/60 font-medium">
                <p>📅 {exp.date}</p>
                <p>🕘 {exp.time}</p>
                <p>📍 {exp.loc}</p>
              </div>
              <p className="text-sm text-white/40 mt-3 leading-relaxed">{exp.desc}</p>
            </Card>

            {/* Form fields */}
            <div className="space-y-5">
              {FORM_FIELDS.map((field) => {
                if (field.type === 'heading') {
                  return (
                    <div key={field.id} className="pt-3">
                      <h3 className="text-sm font-black text-black uppercase tracking-wider">
                        {field.label}
                      </h3>
                      <div className="h-0.5 bg-bus mt-2" />
                    </div>
                  );
                }

                if (field.type === 'doc') {
                  return (
                    <DocumentViewer
                      key={field.id}
                      title={field.label}
                      content={exp.indemnification}
                      required
                    />
                  );
                }

                if (field.type === 'chk') {
                  return (
                    <label
                      key={field.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        checks[field.id]
                          ? 'bg-bus/10 border-bus'
                          : 'bg-black/3 border-black/8 hover:border-bus/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checks[field.id] || false}
                        onChange={() => toggleCheck(field.id)}
                        className="mt-0.5 w-5 h-5 rounded accent-bus"
                      />
                      <span className="text-sm text-black font-medium leading-relaxed">
                        {field.label}
                        {field.req && (
                          <span className="text-bus ml-1 text-xs font-black">
                            ({t('required')})
                          </span>
                        )}
                      </span>
                    </label>
                  );
                }

                if (field.type === 'drop') {
                  return (
                    <Input key={field.id} label={field.label} required={field.req}>
                      <select
                        value={formData[field.id] || ''}
                        onChange={(e) => setField(field.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-bus focus:ring-2 focus:ring-bus/30 text-black bg-white font-medium"
                      >
                        <option value="">{t('select')}</option>
                        {field.opts?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </Input>
                  );
                }

                if (field.type === 'area') {
                  return (
                    <Input key={field.id} label={field.label} required={field.req}>
                      <textarea
                        rows={3}
                        value={formData[field.id] || ''}
                        onChange={(e) => setField(field.id, e.target.value)}
                        placeholder={field.ph}
                        className="w-full px-4 py-3 rounded-xl border-2 border-black/10 focus:outline-none focus:border-bus focus:ring-2 focus:ring-bus/30 text-black placeholder-black/30 resize-none font-medium"
                      />
                    </Input>
                  );
                }

                return (
                  <Input
                    key={field.id}
                    label={field.label}
                    type={field.type === 'date' ? 'date' : 'text'}
                    required={field.req}
                    value={formData[field.id] || ''}
                    onChange={(e) => setField(field.id, e.target.value)}
                    placeholder={field.ph}
                  />
                );
              })}

              {/* School addendum */}
              {addendum && (
                <>
                  <h3 className="text-sm font-black text-black uppercase tracking-wider pt-3">
                    {t('schoolRequirements')}
                  </h3>
                  <DocumentViewer title={addendum.name} content={addendum.text} required />
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    addSchoolChk
                      ? 'bg-bus/10 border-bus'
                      : 'bg-black/3 border-black/8 hover:border-bus/50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={addSchoolChk}
                      onChange={() => setAddSchoolChk(!addSchoolChk)}
                      className="mt-0.5 w-5 h-5 rounded accent-bus"
                    />
                    <span className="text-sm text-black font-medium leading-relaxed">
                      {t('iAgreeToSchool', { school: addendum.name })}
                      <span className="text-bus ml-1 text-xs font-black">({t('required')})</span>
                    </span>
                  </label>
                </>
              )}
            </div>

            <Button full sz="lg" disabled={!formValid || !schoolValid} onClick={() => setStep(1)}>
              {t('continueToSignature')} →
            </Button>
          </div>
        )}

        {/* ═══════════ STEP 1: SIGNATURE ═══════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-black tracking-tight">
                {t('signPermissionSlip')}
              </h2>
              <p className="text-sm text-black/50 mt-1 font-medium">{t('bySigningConfirm')}</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'c1', text: t('iAmGuardianOf', { name: stuName }) },
                { id: 'c2', text: t('iReadPermission') },
                { id: 'c3', text: t('iGivePermission') },
                { id: 'c4', text: t('allInfoAccurate') },
              ].map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    checks[c.id]
                      ? 'bg-bus/10 border-bus'
                      : 'bg-black/3 border-black/8 hover:border-bus/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checks[c.id] || false}
                    onChange={() => toggleCheck(c.id)}
                    className="w-5 h-5 rounded accent-bus"
                  />
                  <span className="text-sm text-black font-medium">{c.text}</span>
                </label>
              ))}
            </div>

            <div>
              <p className="text-sm font-black text-black mb-2">{t('yourSignature')}</p>
              <SignaturePad onSave={() => setSigOk(true)} saved={sigOk} />
              <p className="text-xs text-black/30 mt-2 font-medium">🔒 {t('encrypted')}</p>
            </div>

            <div className="flex gap-3">
              <Button v="outline" sz="lg" onClick={() => setStep(0)}>{t('back')}</Button>
              <Button full sz="lg" disabled={!sigValid} onClick={() => setStep(2)}>
                {t('continueToPayment')} →
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2: PAYMENT ═══════════ */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-black tracking-tight">{t('payment')}</h2>

            {/* No student left behind */}
            <div className="bg-bus rounded-2xl p-5">
              <p className="font-black text-black">{t('noStudentLeftOut')}</p>
              <p className="text-sm text-black/50 mt-1 leading-relaxed font-medium">{t('noStudentLeftOutDesc')}</p>
              <button className="text-xs text-black font-black mt-2 hover:underline">
                {t('learnAboutFund')} →
              </button>
            </div>

            {/* Payment amount options */}
            <div className="space-y-3">
              {([
                { opt: 'full' as const, label: t('payInFull', { amount: costDollars }), desc: t('busTransportationFee') },
                { opt: 'partial' as const, label: t('payPartial'), desc: t('payPartialDesc') },
                { opt: 'cant' as const, label: t('needAssistance'), desc: t('needAssistanceDesc') },
              ]).map((p) => (
                <label
                  key={p.opt}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    payOpt === p.opt
                      ? 'border-bus bg-bus/10'
                      : 'border-black/8 hover:border-bus/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payopt"
                      checked={payOpt === p.opt}
                      onChange={() => setPayOpt(p.opt)}
                      className="w-5 h-5 accent-bus"
                    />
                    <div>
                      <p className="text-sm font-bold text-black">{p.label}</p>
                      <p className="text-xs text-black/40 font-medium">{p.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Partial amount input */}
            {payOpt === 'partial' && (
              <div>
                <Input
                  label={t('amountYouCanPay')}
                  type="number"
                  min="1"
                  placeholder="0.00"
                  value={partialAmt}
                  onChange={(e) => setPartialAmt(e.target.value)}
                />
                <p className="text-xs text-black/30 mt-1 font-medium">
                  {t('fullCostIs', { amount: costDollars })}
                </p>
              </div>
            )}

            {/* ─── Payment method selector ─── */}
            {payOpt !== 'cant' && (
              <div className="space-y-4">
                <p className="text-sm font-black text-black">Choose payment method</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-start transition-all ${
                        payMethod === m.id
                          ? 'border-bus bg-bus/10'
                          : 'border-black/8 hover:border-bus/50'
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-sm font-bold text-black">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Card form */}
                {payMethod === 'card' && (
                  <div className="space-y-3 p-4 bg-black/3 rounded-xl border border-black/8">
                    <Input label={t('cardNumber')} placeholder="4242 4242 4242 4242" value="4242 4242 4242 4242" readOnly />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={t('expiry')} placeholder="12/28" value="12/28" readOnly />
                      <Input label="CVC" placeholder="123" value="123" readOnly />
                    </div>
                  </div>
                )}

                {/* Cash App / Venmo / Zelle / Chime info */}
                {payMethod === 'cashapp' && (
                  <Card dark className="p-4">
                    <p className="text-sm font-black text-bus">Cash App</p>
                    <p className="text-sm text-white/70 mt-1 font-medium">Send to <span className="font-black text-bus">$TripSlipFund</span></p>
                    <p className="text-xs text-white/40 mt-2 font-medium">Include student name in the note. You'll receive a confirmation text.</p>
                  </Card>
                )}
                {payMethod === 'venmo' && (
                  <Card dark className="p-4">
                    <p className="text-sm font-black text-bus">Venmo</p>
                    <p className="text-sm text-white/70 mt-1 font-medium">Send to <span className="font-black text-bus">@TripSlip-Fund</span></p>
                    <p className="text-xs text-white/40 mt-2 font-medium">Include student name in the note. You'll receive a confirmation text.</p>
                  </Card>
                )}
                {payMethod === 'zelle' && (
                  <Card dark className="p-4">
                    <p className="text-sm font-black text-bus">Zelle</p>
                    <p className="text-sm text-white/70 mt-1 font-medium">Send to <span className="font-black text-bus">pay@tripslip.org</span></p>
                    <p className="text-xs text-white/40 mt-2 font-medium">Use your bank's Zelle feature. Include student name in the memo.</p>
                  </Card>
                )}
                {payMethod === 'chime' && (
                  <Card dark className="p-4">
                    <p className="text-sm font-black text-bus">Chime</p>
                    <p className="text-sm text-white/70 mt-1 font-medium">Send to <span className="font-black text-bus">$TripSlipFund</span> on Chime</p>
                    <p className="text-xs text-white/40 mt-2 font-medium">Include student name in the note. You'll receive a confirmation text.</p>
                  </Card>
                )}
                {(payMethod === 'applepay' || payMethod === 'googlepay') && (
                  <div className="p-5 rounded-xl text-center bg-black text-white">
                    <p className="font-black text-sm">
                      {payMethod === 'applepay' ? ' Pay' : 'Google Pay'}
                    </p>
                    <p className="text-xs mt-1 text-white/40 font-medium">Tap to pay with {payMethod === 'applepay' ? 'Apple' : 'Google'} Pay</p>
                  </div>
                )}
              </div>
            )}

            {/* Assistance message */}
            {payOpt === 'cant' && (
              <div className="bg-ts-green/10 border-2 border-ts-green/30 rounded-2xl p-5">
                <p className="text-sm font-black text-ts-green">
                  ✓ {t('financialAssistance')} — {t('covered')}
                </p>
                <p className="text-xs text-ts-green/70 mt-1 font-medium">{t('spotConfirmed')}</p>
              </div>
            )}

            {/* Donation (only for full) */}
            {payOpt === 'full' && (
              <Card className="p-5 border-2 border-bus/30 bg-bus/5">
                <p className="text-sm font-black text-black">💛 {t('tripSlipFund')}</p>
                <p className="text-xs text-black/40 mt-1 font-medium">{t('thankYouFund')}</p>
                <div className="flex gap-2 mt-3">
                  {['5', '10', '25'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDonAmt(donAmt === amt ? '' : amt)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-black border-2 transition-all ${
                        donAmt === amt
                          ? 'border-bus bg-bus text-black'
                          : 'border-black/10 text-black/60 hover:border-bus'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button v="outline" sz="lg" onClick={() => setStep(1)}>{t('back')}</Button>
              <Button full sz="lg" onClick={() => {
                // Build payment list
                const payments: { type: 'REQ' | 'DON'; method: string; cents: number }[] = [];
                const payCents = payOpt === 'full'
                  ? exp.cents
                  : payOpt === 'partial'
                    ? Math.round(parseFloat(partialAmt || '0') * 100)
                    : 0;
                if (payCents > 0) {
                  payments.push({ type: 'REQ', method: payMethod, cents: payCents });
                }
                if (donAmt && payOpt === 'full') {
                  payments.push({ type: 'DON', method: payMethod, cents: Math.round(parseFloat(donAmt) * 100) });
                }

                // Persist to Supabase → triggers realtime for teacher dashboard
                completeSlip(slip.id, formData, 'sig-placeholder', payments.length > 0 ? payments : undefined);
                setStep(3);
              }}>
                {payOpt === 'cant'
                  ? t('submitPermissionSlip')
                  : `${t('pay')} $${payOpt === 'partial' ? partialAmt || '0' : costDollars}${
                      donAmt ? ` + $${donAmt}` : ''
                    }`}
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3: CONFIRMATION ═══════════ */}
        {step === 3 && (
          <div className="py-16 text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-bus flex items-center justify-center mx-auto">
              <span className="text-4xl">✓</span>
            </div>

            <h2 className="text-3xl font-black text-black tracking-tight">
              {t('youreAllSet')}
            </h2>

            <Card className="p-6 text-start space-y-4 mx-auto max-w-sm">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ts-green flex items-center justify-center text-white text-sm font-bold shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-black text-black">{t('permissionGrantedFor')}</p>
                  <p className="text-sm text-black/50 font-medium">{stuName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ts-green flex items-center justify-center text-white text-sm font-bold shrink-0">
                  ✓
                </span>
                <div>
                  {payOpt === 'full' && (
                    <>
                      <p className="text-sm font-black text-black">
                        {t('paymentConfirmed')} — ${costDollars}
                      </p>
                      {donAmt && (
                        <p className="text-sm text-black/50 font-medium">
                          + ${donAmt} {t('toTripSlipFund')}
                        </p>
                      )}
                    </>
                  )}
                  {payOpt === 'partial' && (
                    <>
                      <p className="text-sm font-black text-black">
                        {t('partialPaymentConfirmed')} — ${partialAmt || '0'}
                      </p>
                      <p className="text-sm text-black/50 font-medium">{t('fundCoversRest')}</p>
                    </>
                  )}
                  {payOpt === 'cant' && (
                    <>
                      <p className="text-sm font-black text-black">
                        {t('financialAssistanceRequested')}
                      </p>
                      <p className="text-sm text-black/50 font-medium">{t('spotConfirmed')}</p>
                    </>
                  )}
                </div>
              </div>

              {payOpt !== 'cant' && (
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-bus flex items-center justify-center text-black text-sm shrink-0">
                    💳
                  </span>
                  <p className="text-sm text-black/40 font-medium">
                    via {PAY_METHODS.find((m) => m.id === payMethod)?.label}
                  </p>
                </div>
              )}
            </Card>

            <p className="text-sm text-black/30 font-medium">
              {t('confirmationSentTo')} {guardian.email}
            </p>

            <Card dark className="p-5 mx-auto max-w-sm text-start">
              <p className="text-sm font-black text-bus mb-1">{t('saveYourInfo')}</p>
              <p className="text-xs text-white/40 mb-3 font-medium">{t('freeAccountNoReEntry')}</p>
              <Button full sz="sm">{t('save')}</Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
