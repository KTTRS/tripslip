import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@tripslip/ui'

const plans = [
  {
    name: 'Teacher',
    price: 'Free',
    description: 'Perfect for independent teachers',
    features: [
      'Unlimited permission slips',
      'Digital signatures',
      'Payment collection',
      'SMS notifications via Twilio',
      'Basic reporting'
    ],
    cta: 'Start Free',
    highlighted: false,
    icon: '/images/icon-permission.png',
    gradient: 'from-blue-50 to-blue-100/50'
  },
  {
    name: 'School',
    price: '$99',
    period: '/month',
    description: 'For schools and districts',
    features: [
      'Everything in Teacher',
      'Unlimited teachers',
      'School approval workflow',
      'Advanced analytics',
      'Priority support',
      'Custom branding'
    ],
    cta: 'Start Trial',
    highlighted: true,
    icon: '/images/icon-tracking.png',
    gradient: 'from-primary/5 to-primary/15'
  },
  {
    name: 'Venue',
    price: '$199',
    period: '/month',
    description: 'For museums, zoos, and venues',
    features: [
      'Experience marketplace listing',
      'Booking management',
      'Revenue dashboard',
      'Automated confirmations',
      'Venue discovery inclusion',
      'Dedicated account manager'
    ],
    cta: 'Contact Sales',
    highlighted: false,
    icon: '/images/icon-venue.png',
    gradient: 'from-green-50 to-green-100/50'
  }
]

export default function PricingTable() {
  const getAppLink = (planName: string) => {
    switch (planName) {
      case 'Teacher': return '/teacher/signup';
      case 'School': return '/school/signup';
      case 'Venue': return '/venue/signup';
      default: return '/apps';
    }
  };

  return (
    <section className="bg-white py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary/50 rounded-full px-4 py-1.5 mb-4">
            <span className="text-sm font-semibold text-black">Pricing</span>
          </div>
          <h2 className="text-4xl font-bold text-black sm:text-5xl">
            Simple, <span className="text-primary">transparent</span> pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that works for you. Always free for teachers.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`border-2 border-black relative ${
                plan.highlighted
                  ? 'shadow-offset-lg bg-gradient-to-b ' + plan.gradient + ' scale-105 z-10'
                  : 'shadow-offset bg-gradient-to-b ' + plan.gradient
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary border-2 border-black rounded-full px-4 py-1 text-sm font-bold text-black shadow-[2px_2px_0px_#0A0A0A]">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-black p-1.5 flex items-center justify-center">
                    <img src={plan.icon} alt="" className="w-6 h-6 object-contain" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-black">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-600 text-lg">{plan.period}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/30 border border-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full border-2 border-black shadow-[2px_2px_0px_#0A0A0A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all ${
                    plan.highlighted
                      ? 'bg-black text-white hover:bg-gray-800'
                      : ''
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => window.location.href = getAppLink(plan.name)}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
