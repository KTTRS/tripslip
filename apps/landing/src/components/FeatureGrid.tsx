import { Card, CardHeader, CardTitle, CardDescription } from '@tripslip/ui'

const features = [
  {
    title: 'Digital Permission Slips',
    description: 'No more paper forms. Parents sign and submit everything online from their phone.',
    icon: '📝'
  },
  {
    title: 'Instant Payments',
    description: 'Collect trip fees securely with Stripe. Split payments between multiple parents.',
    icon: '💳'
  },
  {
    title: 'Magic Links',
    description: 'Parents access their permission slip with one click. No passwords required.',
    icon: '✨'
  },
  {
    title: 'Real-time Tracking',
    description: 'See who has signed and paid in real-time. Send automatic reminders.',
    icon: '📊'
  },
  {
    title: 'Multi-language Support',
    description: 'Communicate with parents in English, Spanish, or Arabic with automatic translation.',
    icon: '🌍'
  },
  {
    title: 'Venue Marketplace',
    description: 'Discover and book educational experiences from museums, zoos, and cultural centers.',
    icon: '🎭'
  }
]

export default function FeatureGrid() {
  return (
    <section id="features" className="bg-gray-50 py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black sm:text-5xl">
            Everything you need
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Powerful features that make field trip planning effortless
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card 
              key={feature.title}
              className="border-2 border-black shadow-offset hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
