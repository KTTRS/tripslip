import Header from '../components/Header'
import Footer from '../components/Footer'
import { Button } from '@tripslip/ui'
import { getAppUrl } from '../utils/appUrls'

const apps = [
  {
    name: 'Teacher Portal',
    key: 'teacher' as const,
    emoji: '🎒',
    description: 'Plan and manage field trips, create permission slips, track payments, and communicate with parents.',
    color: 'from-blue-50 to-purple-50',
  },
  {
    name: 'Parent Portal',
    key: 'parent' as const,
    emoji: '👨‍👩‍👧',
    description: 'Sign permission slips, make payments, and stay informed about your child\'s school trips.',
    color: 'from-yellow-50 to-orange-50',
  },
  {
    name: 'Venue Portal',
    key: 'venue' as const,
    emoji: '🏛️',
    description: 'Manage your venue, handle bookings from schools, and coordinate visit logistics.',
    color: 'from-green-50 to-teal-50',
  },
  {
    name: 'School Admin',
    key: 'school' as const,
    emoji: '🏫',
    description: 'Oversee all field trip activity across your school, manage teachers, and view reports.',
    color: 'from-pink-50 to-red-50',
  },
]

export default function AppsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
              TripSlip Apps
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Access each portal directly from here.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {apps.map((app) => (
              <div
                key={app.key}
                className={`bg-gradient-to-br ${app.color} rounded-2xl border-2 border-black p-6 shadow-offset hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all`}
              >
                <div className="text-4xl mb-3">{app.emoji}</div>
                <h2 className="text-xl font-bold text-black mb-2">{app.name}</h2>
                <p className="text-sm text-gray-700 mb-4">{app.description}</p>
                <Button
                  className="w-full border-2 border-black"
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
