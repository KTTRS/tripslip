import Header from '../components/Header'
import Footer from '../components/Footer'
import { Button } from '@tripslip/ui'
import { getAppUrl } from '../utils/appUrls'

const apps = [
  {
    name: 'Teacher Portal',
    key: 'teacher' as const,
    icon: '/images/icon-permission.png',
    description: 'Plan and manage field trips, create permission slips, track payments, and communicate with parents.',
    color: 'from-blue-50 to-purple-50',
    accent: 'bg-blue-100'
  },
  {
    name: 'Parent Portal',
    key: 'parent' as const,
    icon: '/images/icon-magic.png',
    description: 'Sign permission slips, make payments, and stay informed about your child\'s school trips.',
    color: 'from-yellow-50 to-orange-50',
    accent: 'bg-yellow-100'
  },
  {
    name: 'Venue Portal',
    key: 'venue' as const,
    icon: '/images/icon-venue.png',
    description: 'Manage your venue, handle bookings from schools, and coordinate visit logistics.',
    color: 'from-green-50 to-teal-50',
    accent: 'bg-green-100'
  },
  {
    name: 'School Admin',
    key: 'school' as const,
    icon: '/images/icon-tracking.png',
    description: 'Oversee all field trip activity across your school, manage teachers, and view reports.',
    color: 'from-pink-50 to-red-50',
    accent: 'bg-pink-100'
  },
]

export default function AppsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-white to-gray-50 py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary/50 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-semibold text-black">Platform Access</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
              TripSlip <span className="text-primary">Apps</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Access each portal directly from here
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {apps.map((app) => (
              <div
                key={app.key}
                className={`bg-gradient-to-br ${app.color} rounded-2xl border-2 border-black p-6 shadow-offset hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group`}
              >
                <div className={`w-14 h-14 rounded-xl ${app.accent} border-2 border-black p-2 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <img src={app.icon} alt="" className="w-8 h-8 object-contain" />
                </div>
                <h2 className="text-xl font-bold text-black mb-2">{app.name}</h2>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{app.description}</p>
                <Button
                  className="w-full border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  onClick={() => window.location.href = getAppUrl(app.key)}
                >
                  Open {app.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
