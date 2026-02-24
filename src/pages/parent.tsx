import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { DocumentViewer } from '../components/document-viewer';
import { SignaturePad } from '../components/signature-pad';
import {
  EXPERIENCE as EXP,
  INDEMNIFICATION,
  SCHOOL_ADDENDUMS,
  FORM_FIELDS,
  getSlipByToken,
  getStudentById,
  getGuardian,
  getInvById,
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

  // ── Data lookup ──
  const slip = getSlipByToken(token ?? '');
  const student = slip ? getStudentById(slip.sid) : undefined;
  const guardian = student ? getGuardian(student.id) : undefined;
  const inv = slip ? getInvById(slip.inv) : undefined;
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
  if (!slip || !student || !guardian || !inv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link not found</h2>
          <p className="text-gray-500 mb-6 text-sm">This permission slip link is invalid or expired.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const costDollars = (EXP.cents / 100).toFixed(2);
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
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center">
                <span className="text-white font-black text-[10px]">TS</span>
              </div>
              <span className="text-xs font-semibold text-gray-400">{steps[step]}</span>
            </div>
            <div className="flex gap-1">
              {['en', 'es'].map((lng) => (
                <button
                  key={lng}
                  onClick={() => i18n.changeLanguage(lng)}
                  className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    i18n.language === lng
                      ? 'bg-charcoal text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="h-1 bg-gray-100">
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
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {t('permissionSlipFor')}
              </h2>
              <p className="text-lg font-bold text-charcoal mt-1">{stuName}</p>
            </div>

            {/* Experience card */}
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-2">{EXP.title}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📅 {EXP.date}</p>
                <p>🕘 {EXP.time}</p>
                <p>📍 {EXP.loc}</p>
              </div>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">{EXP.desc}</p>
            </Card>

            {/* Form fields */}
            <div className="space-y-5">
              {FORM_FIELDS.map((field) => {
                if (field.type === 'heading') {
                  return (
                    <div key={field.id} className="pt-3">
                      <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                        {field.label}
                      </h3>
                      <div className="h-px bg-gray-100 mt-2" />
                    </div>
                  );
                }

                if (field.type === 'doc') {
                  return (
                    <DocumentViewer
                      key={field.id}
                      title={field.label}
                      content={INDEMNIFICATION}
                      required
                    />
                  );
                }

                if (field.type === 'chk') {
                  return (
                    <label
                      key={field.id}
                      className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checks[field.id] || false}
                        onChange={() => toggleCheck(field.id)}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-charcoal"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {field.label}
                        {field.req && (
                          <span className="text-ts-red ml-1 text-xs font-semibold">
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bus focus:border-transparent text-gray-900 bg-white"
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bus focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
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
                  <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider pt-3">
                    {t('schoolRequirements')}
                  </h3>
                  <DocumentViewer title={addendum.name} content={addendum.text} required />
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addSchoolChk}
                      onChange={() => setAddSchoolChk(!addSchoolChk)}
                      className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-charcoal"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {t('iAgreeToSchool', { school: addendum.name })}
                      <span className="text-ts-red ml-1 text-xs font-semibold">({t('required')})</span>
                    </span>
                  </label>
                </>
              )}
            </div>

            <Button full sz="lg" disabled={!formValid || !schoolValid} onClick={() => setStep(1)}>
              {t('continueToSignature')}
            </Button>
          </div>
        )}

        {/* ═══════════ STEP 1: SIGNATURE ═══════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {t('signPermissionSlip')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{t('bySigningConfirm')}</p>
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
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                    checks[c.id]
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checks[c.id] || false}
                    onChange={() => toggleCheck(c.id)}
                    className="w-5 h-5 rounded border-gray-300 accent-charcoal"
                  />
                  <span className="text-sm text-gray-700">{c.text}</span>
                </label>
              ))}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">{t('yourSignature')}</p>
              <SignaturePad onSave={() => setSigOk(true)} saved={sigOk} />
              <p className="text-xs text-gray-400 mt-2">🔒 {t('encrypted')}</p>
            </div>

            <div className="flex gap-3">
              <Button v="light" sz="lg" onClick={() => setStep(0)}>{t('back')}</Button>
              <Button full sz="lg" disabled={!sigValid} onClick={() => setStep(2)}>
                {t('continueToPayment')}
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2: PAYMENT ═══════════ */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('payment')}</h2>

            {/* No student left behind */}
            <Card className="p-5 bg-mint border-none">
              <p className="font-bold text-charcoal">{t('noStudentLeftOut')}</p>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t('noStudentLeftOutDesc')}</p>
              <button className="text-xs text-ts-blue font-semibold mt-2 hover:underline">
                {t('learnAboutFund')}
              </button>
            </Card>

            {/* Payment amount options */}
            <div className="space-y-3">
              {([
                { opt: 'full' as const, label: t('payInFull', { amount: costDollars }), desc: t('busTransportationFee') },
                { opt: 'partial' as const, label: t('payPartial'), desc: t('payPartialDesc') },
                { opt: 'cant' as const, label: t('needAssistance'), desc: t('needAssistanceDesc') },
              ]).map((p) => (
                <label
                  key={p.opt}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    payOpt === p.opt
                      ? 'border-charcoal bg-gray-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payopt"
                      checked={payOpt === p.opt}
                      onChange={() => setPayOpt(p.opt)}
                      className="w-5 h-5 accent-charcoal"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
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
                <p className="text-xs text-gray-400 mt-1">
                  {t('fullCostIs', { amount: costDollars })}
                </p>
              </div>
            )}

            {/* ─── Payment method selector ─── */}
            {payOpt !== 'cant' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-900">Choose payment method</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        payMethod === m.id
                          ? 'border-charcoal bg-charcoal/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Card form (only for card) */}
                {payMethod === 'card' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                    <Input label={t('cardNumber')} placeholder="4242 4242 4242 4242" value="4242 4242 4242 4242" readOnly />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={t('expiry')} placeholder="12/28" value="12/28" readOnly />
                      <Input label="CVC" placeholder="123" value="123" readOnly />
                    </div>
                  </div>
                )}

                {/* Cash App / Venmo / Zelle / Chime info */}
                {payMethod === 'cashapp' && (
                  <Card className="p-4 bg-emerald-50 border-emerald-200">
                    <p className="text-sm font-semibold text-emerald-800">Cash App</p>
                    <p className="text-sm text-emerald-700 mt-1">Send to <span className="font-bold">$TripSlipFund</span></p>
                    <p className="text-xs text-emerald-600 mt-2">Include student name in the note. You'll receive a confirmation text.</p>
                  </Card>
                )}
                {payMethod === 'venmo' && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-sm font-semibold text-blue-800">Venmo</p>
                    <p className="text-sm text-blue-700 mt-1">Send to <span className="font-bold">@TripSlip-Fund</span></p>
                    <p className="text-xs text-blue-600 mt-2">Include student name in the note. You'll receive a confirmation text.</p>
                  </Card>
                )}
                {payMethod === 'zelle' && (
                  <Card className="p-4 bg-purple-50 border-purple-200">
                    <p className="text-sm font-semibold text-purple-800">Zelle</p>
                    <p className="text-sm text-purple-700 mt-1">Send to <span className="font-bold">pay@tripslip.org</span></p>
                    <p className="text-xs text-purple-600 mt-2">Use your bank's Zelle feature. Include student name in the memo.</p>
                  </Card>
                )}
                {payMethod === 'chime' && (
                  <Card className="p-4 bg-green-50 border-green-200">
                    <p className="text-sm font-semibold text-green-800">Chime</p>
                    <p className="text-sm text-green-700 mt-1">Send to <span className="font-bold">$TripSlipFund</span> on Chime</p>
                    <p className="text-xs text-green-600 mt-2">Include student name in the note. You'll receive a confirmation text.</p>
                  </Card>
                )}
                {(payMethod === 'applepay' || payMethod === 'googlepay') && (
                  <div
                    className={`p-4 rounded-xl text-center ${
                      payMethod === 'applepay' ? 'bg-gray-900 text-white' : 'bg-white border-2 border-gray-200'
                    }`}
                  >
                    <p className="font-semibold text-sm">
                      {payMethod === 'applepay' ? '  Pay' : 'Google Pay'}
                    </p>
                    <p className="text-xs mt-1 opacity-70">Tap to pay with {payMethod === 'applepay' ? 'Apple' : 'Google'} Pay</p>
                  </div>
                )}
              </div>
            )}

            {/* Assistance message */}
            {payOpt === 'cant' && (
              <Card className="p-5 bg-emerald-50 border-emerald-100">
                <p className="text-sm font-semibold text-emerald-800">
                  ✓ {t('financialAssistance')} — {t('covered')}
                </p>
                <p className="text-xs text-emerald-700 mt-1">{t('spotConfirmed')}</p>
              </Card>
            )}

            {/* Donation (only for full) */}
            {payOpt === 'full' && (
              <Card className="p-5 border-bus/30">
                <p className="text-sm font-bold text-charcoal">💛 {t('tripSlipFund')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('thankYouFund')}</p>
                <div className="flex gap-2 mt-3">
                  {['5', '10', '25'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDonAmt(donAmt === amt ? '' : amt)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        donAmt === amt
                          ? 'border-bus bg-bus/10 text-charcoal'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button v="light" sz="lg" onClick={() => setStep(1)}>{t('back')}</Button>
              <Button full sz="lg" onClick={() => setStep(3)}>
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
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <span className="text-4xl text-emerald-600">✓</span>
            </div>

            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {t('youreAllSet')}
            </h2>

            <Card className="p-6 text-left space-y-4 mx-auto max-w-sm">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold shrink-0">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('permissionGrantedFor')}</p>
                  <p className="text-sm text-gray-600">{stuName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold shrink-0">
                  ✓
                </span>
                <div>
                  {payOpt === 'full' && (
                    <>
                      <p className="text-sm font-semibold text-gray-900">
                        {t('paymentConfirmed')} — ${costDollars}
                      </p>
                      {donAmt && (
                        <p className="text-sm text-gray-600">
                          + ${donAmt} {t('toTripSlipFund')}
                        </p>
                      )}
                    </>
                  )}
                  {payOpt === 'partial' && (
                    <>
                      <p className="text-sm font-semibold text-gray-900">
                        {t('partialPaymentConfirmed')} — ${partialAmt || '0'}
                      </p>
                      <p className="text-sm text-gray-600">{t('fundCoversRest')}</p>
                    </>
                  )}
                  {payOpt === 'cant' && (
                    <>
                      <p className="text-sm font-semibold text-gray-900">
                        {t('financialAssistanceRequested')}
                      </p>
                      <p className="text-sm text-gray-600">{t('spotConfirmed')}</p>
                    </>
                  )}
                </div>
              </div>

              {payOpt !== 'cant' && (
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm shrink-0">
                    💳
                  </span>
                  <p className="text-sm text-gray-500">
                    via {PAY_METHODS.find((m) => m.id === payMethod)?.label}
                  </p>
                </div>
              )}
            </Card>

            <p className="text-sm text-gray-400">
              {t('confirmationSentTo')} {guardian.email}
            </p>

            <Card className="p-5 mx-auto max-w-sm text-left">
              <p className="text-sm font-semibold text-gray-900 mb-1">{t('saveYourInfo')}</p>
              <p className="text-xs text-gray-500 mb-3">{t('freeAccountNoReEntry')}</p>
              <Button full sz="sm">{t('save')}</Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
