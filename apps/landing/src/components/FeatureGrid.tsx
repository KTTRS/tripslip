import { Card, CardHeader, CardTitle, CardDescription } from '@tripslip/ui'

const features = [
  {
    title: 'Digital Permission Slips',
    description: 'No more paper forms. Parents sign and submit everything online from their phone.',
    icon: '/images/icon-permission.png',
    gradient: 'from-blue-50 to-blue-100/50',
    iconBg: 'bg-blue-100',
    iconBorder: 'border-blue-300'
  },
  {
    title: 'Instant Payments',
    description: 'Collect trip fees securely with Stripe. Split payments between multiple parents.',
    icon: '/images/icon-payment.png',
    gradient: 'from-green-50 to-green-100/50',
    iconBg: 'bg-green-100',
    iconBorder: 'border-green-300'
  },
  {
    title: 'Magic Links',
    description: 'Parents access their permission slip with one click. No passwords required.',
    icon: '/images/icon-magic.png',
    gradient: 'from-purple-50 to-purple-100/50',
    iconBg: 'bg-purple-100',
    iconBorder: 'border-purple-300'
  },
  {
    title: 'Real-time Tracking',
    description: 'See who has signed and paid in real-time. Send automatic SMS reminders via Twilio.',
    icon: '/images/icon-tracking.png',
    gradient: 'from-orange-50 to-orange-100/50',
    iconBg: 'bg-orange-100',
    iconBorder: 'border-orange-300'
  },
  {
    title: 'Multi-language Support',
    description: 'Communicate with parents in English, Spanish, or Arabic with automatic translation.',
    icon: '/images/icon-language.png',
    gradient: 'from-pink-50 to-pink-100/50',
    iconBg: 'bg-pink-100',
    iconBorder: 'border-pink-300'
  },
  {
    title: 'Venue Marketplace',
    description: 'Discover and book educational experiences from museums, zoos, and cultural centers.',
    icon: '/images/icon-venue.png',
    gradient: 'from-yellow-50 to-primary-100/50',
    iconBg: 'bg-yellow-100',
    iconBorder: 'border-yellow-400'
  }
]

export default function FeatureGrid() {
  return (
    <section id="features" className="relative bg-gray-50 py-24 px-6 overflow-hidden">
      <div className="absolute top-10 left-10 opacity-30 animate-float pointer-events-none">
        <img src="/images/char-blue-square.png" alt="" className="w-20 h-20 drop-shadow-lg" />
      </div>
      <div className="absolute top-16 right-12 opacity-25 animate-float-delayed pointer-events-none">
        <img src="/images/char-pink-heart.png" alt="" className="w-16 h-16 drop-shadow-lg" />
      </div>
      <div className="absolute bottom-12 left-1/4 opacity-20 animate-bounce-slow pointer-events-none">
        <img src="/images/char-yellow-star.png" alt="" className="w-14 h-14 drop-shadow-lg" />
      </div>
      <div className="absolute bottom-20 right-1/4 opacity-25 animate-float pointer-events-none">
        <img src="/images/char-green-octagon.png" alt="" className="w-16 h-16 drop-shadow-lg" />
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary/50 rounded-full px-4 py-1.5 mb-4">
            <img src="/images/icon-trophy.png" alt="" className="w-5 h-5" />
            <span className="text-sm font-semibold text-black">Powerful Features</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-black sm:text-5xl lg:text-6xl">
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
              className={`border-2 border-black bg-gradient-to-br ${feature.gradient} bg-white shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-300 group cursor-default`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className={`mb-4 w-16 h-16 rounded-2xl ${feature.iconBg} border-2 border-black shadow-[0_2px_0_rgba(0,0,0,0.1),0_4px_0_rgba(0,0,0,0.08),0_8px_0_rgba(0,0,0,0.06)] p-2.5 flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                  <img src={feature.icon} alt="" className="w-10 h-10 object-contain drop-shadow-md" />
                </div>
                <CardTitle className="font-display text-xl font-bold">{feature.title}</CardTitle>
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
