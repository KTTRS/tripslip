import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero: Black header band ── */}
      <div className="bg-black">
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-bus text-black rounded-full text-xs font-black mb-10 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            LIVE MVP
          </div>

          {/* Logo area */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-bus rounded-xl flex items-center justify-center shadow-lg rotate-[-6deg]">
              <span className="text-2xl">🎫</span>
            </div>
            <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter leading-none italic">
              trip<span className="text-bus">slip</span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-white/60 mt-4 max-w-md mx-auto leading-relaxed font-medium">
            Digital permission slips that actually get signed.
          </p>
          <p className="text-xs text-white/30 mt-2 font-semibold tracking-wide uppercase">
            Built for Junior Achievement of Southeastern Michigan
          </p>
        </div>
      </div>

      {/* ── Yellow divider band ── */}
      <div className="bg-bus h-2" />

      {/* ── Flow diagram ── */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-14 text-sm font-black flex-wrap">
          {([
            ['JA Dashboard', 'bg-black text-white'],
            ['→', 'text-black/20'],
            ['Teacher', 'bg-bus text-black'],
            ['→', 'text-black/20'],
            ['Parent', 'bg-black text-bus'],
            ['→', 'text-black/20'],
            ['Auto-Report', 'bg-bus text-black text-xs'],
          ] as const).map(([label, cls], i) =>
            label === '→' ? (
              <span key={i} className={`text-xl ${cls}`}>→</span>
            ) : (
              <span key={i} className={`px-5 py-2.5 rounded-xl shadow-md ${cls}`}>
                {label}
              </span>
            ),
          )}
        </div>

        {/* ── Entry point cards ── */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            {
              icon: '🏢',
              label: 'JA Dashboard',
              desc: 'All experiences, schools, real-time completion, payments, Field Trip Fund.',
              bg: 'bg-black',
              text: 'text-white',
              sub: 'text-white/50',
              go: () => navigate('/dashboard'),
            },
            {
              icon: '👩‍🏫',
              label: 'Teacher View',
              desc: 'Cass Tech — add students, customize forms, send to parents.',
              bg: 'bg-bus',
              text: 'text-black',
              sub: 'text-black/50',
              go: () => navigate('/t/i0'),
            },
            {
              icon: '📱',
              label: 'Parent View',
              desc: 'Full indemnification, sign, pay or request assistance. One link.',
              bg: 'bg-white border-2 border-black',
              text: 'text-black',
              sub: 'text-black/50',
              go: () => navigate('/p/tok-s4'),
            },
          ].map((x) => (
            <button
              key={x.label}
              onClick={x.go}
              className={`group p-7 rounded-2xl ${x.bg} transition-all text-left shadow-lg hover:shadow-2xl hover:-translate-y-2 duration-200`}
            >
              <div className="text-4xl mb-5">{x.icon}</div>
              <h3 className={`font-black text-lg mb-2 ${x.text}`}>{x.label}</h3>
              <p className={`text-sm leading-relaxed ${x.sub}`}>{x.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button v="dark" sz="lg" onClick={() => navigate('/dashboard')}>
            Open Dashboard →
          </Button>
        </div>

        <p className="text-center text-[11px] text-black/30 mt-8 font-medium">
          Pre-loaded: Stock Market Challenge · 6 schools · 15 students · Full
          indemnification · EN/ES · No student left behind
        </p>
      </div>
    </div>
  );
}
