const steps = [
  {
    number: '01',
    title: 'Teacher creates a trip',
    description: 'Pick a venue, set the date, add trip fees. TripSlip generates digital permission slips automatically.',
    icon: '/images/icon-permission.png',
    color: 'bg-blue-50',
  },
  {
    number: '02',
    title: 'Parents get a text',
    description: 'A magic link arrives via SMS. Parents tap to review trip details, sign digitally, and pay — all in 60 seconds.',
    icon: '/images/icon-magic.png',
    color: 'bg-green-50',
  },
  {
    number: '03',
    title: 'School approves',
    description: 'School admins review the trip, check compliance, and approve with one click. Full audit trail included.',
    icon: '/images/icon-tracking.png',
    color: 'bg-purple-50',
  },
  {
    number: '04',
    title: 'Kids explore!',
    description: 'With permissions signed, payments collected, and venues booked — the only thing left is the adventure.',
    icon: '/images/icon-bus.png',
    color: 'bg-primary/10',
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary/50 rounded-full px-4 py-1.5 mb-4">
            <span className="text-sm font-semibold text-black">How It Works</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-black sm:text-5xl">
            From plan to <span className="text-primary">adventure</span>
            <br />in four simple steps
          </h2>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className={`${step.color} rounded-2xl border-2 border-black p-6 shadow-offset hover:-translate-x-1 hover:-translate-y-1 hover:shadow-offset-lg transition-all`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl font-bold text-black/10">{step.number}</span>
                    <img src={step.icon} alt="" className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-black mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-24 -right-4 z-20 w-8 h-8 bg-primary rounded-full border-2 border-black items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
