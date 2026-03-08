import Header from '../components/Header'
import Footer from '../components/Footer'
import { Button } from '@tripslip/ui'
import { getAppUrl } from '../utils/appUrls'

const apps = [
  {
    name: 'Teacher Portal',
    key: 'teacher' as const,
    icon: '/images/icon-permission.png',
    character: '/images/char-blue-square.png',
    characterName: 'Buddy',
    characterAction: 'planning your next adventure',
    description: 'Plan and manage field trips, create permission slips, track payments, and communicate with parents.',
    gradient: 'from-blue-100 via-blue-50 to-indigo-50',
    heroGradient: 'from-blue-200 to-indigo-200',
    accent: 'bg-blue-200',
    accentBorder: 'border-blue-400',
    buttonBg: 'bg-blue-500 hover:bg-blue-600',

    features: [
      'Create & manage field trips',
      'Digital permission slips',
      'Payment tracking',
      'Parent communication',
      'Venue discovery & booking',
    ],
  },
  {
    name: 'Parent Portal',
    key: 'parent' as const,
    icon: '/images/icon-magic.png',
    character: '/images/char-pink-heart.png',
    characterName: 'Sparkle',
    characterAction: 'exploring with your kids',
    description: 'Sign permission slips, make payments, and stay informed about your child\'s school trips.',
    gradient: 'from-yellow-100 via-amber-50 to-orange-50',
    heroGradient: 'from-yellow-200 to-orange-200',
    accent: 'bg-yellow-200',
    accentBorder: 'border-yellow-400',
    buttonBg: 'bg-amber-500 hover:bg-amber-600',

    features: [
      'E-sign permission slips',
      'Secure online payments',
      'Trip status updates',
      'Emergency contact info',
      'Split payment options',
    ],
  },
  {
    name: 'Venue Portal',
    key: 'venue' as const,
    icon: '/images/icon-venue.png',
    character: '/images/char-green-octagon.png',
    characterName: 'Scout',
    characterAction: 'navigating bookings',
    description: 'Manage your venue, handle bookings from schools, and coordinate visit logistics.',
    gradient: 'from-green-100 via-emerald-50 to-teal-50',
    heroGradient: 'from-green-200 to-teal-200',
    accent: 'bg-green-200',
    accentBorder: 'border-green-400',
    buttonBg: 'bg-green-500 hover:bg-green-600',

    features: [
      'Booking management',
      'Availability calendar',
      'Experience creation',
      'Financial dashboard',
      'Stripe payment integration',
    ],
  },
  {
    name: 'School Admin',
    key: 'school' as const,
    icon: '/images/icon-tracking.png',
    character: '/images/char-purple-diamond.png',
    characterName: 'Gem',
    characterAction: 'organizing everything',
    description: 'Oversee all field trip activity across your school, manage teachers, and view reports.',
    gradient: 'from-pink-100 via-rose-50 to-purple-50',
    heroGradient: 'from-pink-200 to-purple-200',
    accent: 'bg-pink-200',
    accentBorder: 'border-pink-400',
    buttonBg: 'bg-pink-500 hover:bg-pink-600',

    features: [
      'District-wide oversight',
      'Trip approval workflow',
      'Budget tracking',
      'Teacher management',
      'Compliance reports',
    ],
  },
]

export default function AppsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-primary-50/30 via-white to-gray-50 py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-black rounded-full px-5 py-2 mb-6 shadow-[3px_3px_0px_#0A0A0A]">
              <img src="/images/icon-compass.png" alt="" className="w-8 h-8 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
              <span className="text-sm font-bold text-black font-sans">Platform Access</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight text-black mb-4">
              TripSlip <span className="text-primary">Apps</span>
            </h1>
            <p className="mt-2 text-lg sm:text-xl text-gray-600 font-sans max-w-2xl mx-auto">
              Choose your portal and get started — each one is tailored for your role
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {apps.map((app, index) => (
              <div
                key={app.key}
                className={`bg-gradient-to-br ${app.gradient} rounded-3xl border-3 border-black shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 overflow-hidden group`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`relative bg-gradient-to-r ${app.heroGradient} px-6 pt-6 pb-8 border-b-3 border-black overflow-hidden`}>
                  <div className="flex items-start justify-between">
                    <img src={app.icon} alt="" className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
                    <div className="animate-float">
                      <img
                        src={app.character}
                        alt={`${app.characterName} — ${app.characterAction}`}
                        className="w-20 h-20 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h2 className="text-2xl font-display font-bold text-black">{app.name}</h2>
                    <p className="text-xs font-bold text-black/50 mt-1 font-sans">
                      {app.characterName} is {app.characterAction}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed font-sans">{app.description}</p>

                  <ul className="space-y-2 mb-5">
                    {app.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-800 font-sans">
                        <span className={`w-5 h-5 rounded-md ${app.accent} border border-black flex items-center justify-center flex-shrink-0`}>
                          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full border-2 border-black shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[5px_5px_0px_#0A0A0A] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 font-bold text-base py-3"
                    onClick={() => window.location.href = getAppUrl(app.key)}
                  >
                    Open {app.name} →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
