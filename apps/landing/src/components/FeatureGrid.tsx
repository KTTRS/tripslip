import { Card, CardHeader, CardTitle, CardDescription } from '@tripslip/ui'

const features = [
  {
    title: 'Digital Permission Slips',
    description: 'No more paper forms. Parents sign and submit everything online from their phone.',
    icon: '/images/icon-permission.png'
  },
  {
    title: 'Instant Payments',
    description: 'Collect trip fees securely with Stripe. Split payments between multiple parents.',
    icon: '/images/icon-payment.png'
  },
  {
    title: 'Magic Links',
    description: 'Parents access their permission slip with one click. No passwords required.',
    icon: '/images/icon-magic.png'
  },
  {
    title: 'Real-time Tracking',
    description: 'See who has signed and paid in real-time. Send automatic SMS reminders via Twilio.',
    icon: '/images/icon-tracking.png'
  },
  {
    title: 'Multi-language Support',
    description: 'Communicate with parents in English, Spanish, or Arabic with automatic translation.',
    icon: '/images/icon-language.png'
  },
  {
    title: 'Venue Marketplace',
    description: 'Discover and book educational experiences from museums, zoos, and cultural centers.',
    icon: '/images/icon-venue.png'
  }
]

export default function FeatureGrid() {
  return (
    <section id="features" className="relative bg-gray-50 py-24 px-6 overflow-hidden">
      <div className="absolute top-8 left-8 opacity-40 animate-float">
        <img src="/images/icon-bus.png" alt="" className="w-12 h-12" />
      </div>
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary/50 rounded-full px-4 py-1.5 mb-4">
            <span className="text-sm font-semibold text-black">Powerful Features</span>
          </div>
          <h2 className="text-4xl font-bold text-black sm:text-5xl">
            Everything you need to run
            <br />
            <span className="text-primary">amazing</span> field trips
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            From digital permission slips to venue discovery — TripSlip handles the logistics so you can focus on the learning.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="border-2 border-black shadow-offset hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bg-white group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="mb-4 w-16 h-16 rounded-2xl bg-primary/10 border-2 border-black p-2 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <img src={feature.icon} alt="" className="w-10 h-10 object-contain" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
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
