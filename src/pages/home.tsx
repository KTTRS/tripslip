import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 0%, rgba(14,165,233,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(16,185,129,0.06) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-charcoal text-white rounded-full text-xs font-semibold mb-10 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-bus animate-pulse" />
            Live MVP
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight leading-none">
            TripSlip
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mt-4 max-w-md mx-auto leading-relaxed">
            Digital permission slips that actually get signed.
          </p>
          <p className="text-xs text-gray-400 mt-2 mb-14">
            Built for Junior Achievement of Southeastern Michigan
          </p>

          {/* Flow diagram */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-14 text-xs sm:text-sm font-semibold flex-wrap">
            {(
              [
                ['JA', 'bg-charcoal text-white'],
                ['→', ''],
                ['Teacher', 'bg-ts-blue text-white'],
                ['→', ''],
                ['Parent', 'bg-ts-green text-white'],
                ['↩', ''],
                ['Auto-Report', 'bg-charcoal text-white text-[10px]'],
              ] as const
            ).map(([label, cls], i) =>
              label === '→' || label === '↩' ? (
                <span key={i} className="text-gray-300 text-lg">
                  {label}
                </span>
              ) : (
                <span key={i} className={`px-3 sm:px-4 py-2 rounded-xl shadow-sm ${cls}`}>
                  {label}
                </span>
              ),
            )}
          </div>

          {/* Entry points */}
          <div className="grid sm:grid-cols-3 gap-5 max-w-2xl mx-auto text-left">
            {[
              {
                icon: '🏢',
                label: 'JA Dashboard',
                desc: 'All schools, real-time completion, payments, Field Trip Fund.',
                hover: 'hover:border-charcoal',
                go: () => navigate('/dashboard'),
              },
              {
                icon: '👩‍🏫',
                label: 'Teacher View',
                desc: 'Cass Tech — add students, customize forms, send to parents.',
                hover: 'hover:border-ts-blue',
                go: () => navigate('/t/i0'),
              },
              {
                icon: '📱',
                label: 'Parent View',
                desc: 'Full indemnification, sign, pay or request assistance. One link.',
                hover: 'hover:border-ts-green',
                go: () => navigate('/p/tok-s4'),
              },
            ].map((x) => (
              <button
                key={x.label}
                onClick={x.go}
                className={`group p-6 bg-white rounded-2xl border-2 border-gray-100 ${x.hover} transition-all text-left shadow-sm hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="text-3xl mb-4">{x.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{x.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{x.desc}</p>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-gray-400 mt-10">
            Pre-loaded: Stock Market Challenge · 6 schools · 15 students · Full
            indemnification · EN/ES · No student left behind
          </p>
        </div>
      </div>
    </div>
  );
}
