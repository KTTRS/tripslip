import { Button } from '@tripslip/ui'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-yellow-50/30 to-white py-12 sm:py-16 md:py-24 px-4 sm:px-6">
      <div className="absolute top-10 right-10 animate-float opacity-80 hidden sm:block">
        <img src="/images/icon-bus.png" alt="" className="w-16 sm:w-24 h-16 sm:h-24 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
      </div>
      <div className="absolute bottom-20 left-8 animate-float-delayed opacity-70 hidden sm:block">
        <img src="/images/icon-backpack.png" alt="" className="w-16 sm:w-24 h-16 sm:h-24 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-4 sm:mb-6">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-primary"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-black">Now in pilot — join 50+ schools</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-black leading-[1.1]">
              Field trips{' '}
              <span className="relative">
                <span className="relative z-10 text-primary">without</span>
                <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full z-0" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8C40 2 160 2 198 8" stroke="#F5C518" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </span>
              {' '}the paperwork
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-xl leading-7 sm:leading-8 text-gray-600 max-w-lg">
              Digital permission slips, instant payments, and real-time SMS updates.
              Teachers plan. Parents sign. Kids explore.
            </p>

            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                size="lg"
                className="shadow-offset hover:-translate-x-1 hover:-translate-y-1 hover:shadow-offset-lg transition-all text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
                onClick={() => window.location.href = '/pricing'}
              >
                Start Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-black text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 hover:bg-gray-50"
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                See How It Works
              </Button>
            </div>

            <div className="mt-8 sm:mt-12 flex items-center justify-between sm:justify-start gap-4 sm:gap-10">
              <div className="flex flex-col items-center">
                <p className="text-2xl sm:text-4xl font-bold font-display text-black">100%</p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Paperless</p>
              </div>
              <div className="w-px h-8 sm:h-10 bg-gray-200" />
              <div className="flex flex-col items-center">
                <p className="text-2xl sm:text-4xl font-bold font-display text-black">40+</p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Partner Venues</p>
              </div>
              <div className="w-px h-8 sm:h-10 bg-gray-200" />
              <div className="flex flex-col items-center">
                <p className="text-2xl sm:text-4xl font-bold font-display text-primary">Free</p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">For Teachers</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-3 sm:border-4 border-black shadow-offset-lg">
              <img
                src="/images/hero-fieldtrip.png"
                alt="Happy students on a museum field trip"
                className="w-full h-[280px] sm:h-[380px] lg:h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="bg-primary rounded-full px-2 sm:px-3 py-0.5 sm:py-1 border-2 border-black">
                    <span className="text-xs sm:text-sm font-bold text-black">LIVE TRIP</span>
                  </div>
                  <span className="text-white/80 text-xs sm:text-sm">Science Museum — 3rd Grade</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/30">
                    <p className="text-lg sm:text-2xl font-bold text-white">24/28</p>
                    <p className="text-[10px] sm:text-xs text-white/70">Slips Signed</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/30">
                    <p className="text-lg sm:text-2xl font-bold text-white">22/28</p>
                    <p className="text-[10px] sm:text-xs text-white/70">Payments In</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/30">
                    <p className="text-lg sm:text-2xl font-bold text-white">$440</p>
                    <p className="text-[10px] sm:text-xs text-white/70">Collected</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 animate-bounce-slow hidden sm:block">
              <img src="/images/icon-permission.png" alt="" className="w-14 h-14 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
            </div>
            <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 animate-bounce-slow hidden sm:block" style={{ animationDelay: '0.5s' }}>
              <img src="/images/icon-payment.png" alt="" className="w-14 h-14 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
