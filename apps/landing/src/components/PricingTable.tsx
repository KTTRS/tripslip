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
    gradient: 'from-blue-50 to-blue-100/50',
    iconBg: 'bg-blue-100',
    iconBorder: 'border-blue-300',
    accentColor: 'bg-blue-500',
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
    gradient: 'from-primary/10 to-primary/20',
    iconBg: 'bg-primary/20',
    iconBorder: 'border-primary',
    accentColor: 'bg-primary',
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
    gradient: 'from-green-50 to-green-100/50',
    iconBg: 'bg-green-100',
    iconBorder: 'border-green-300',
    accentColor: 'bg-green-500',
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
    <section className="bg-white py-16 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary/50 rounded-full px-4 py-1.5 mb-4">
            <span className="text-sm font-semibold text-black">Pricing</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-black sm:text-5xl">
            Simple, <span className="text-primary">transparent</span> pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that works for you. Always free for teachers.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`border-3 border-black relative overflow-visible bg-gradient-to-b ${plan.gradient} transition-all duration-300 cursor-pointer group ${
                plan.highlighted
                  ? 'animate-glow-pulse scale-105 z-10'
                  : 'shadow-offset hover:-translate-x-1 hover:-translate-y-1 hover:shadow-offset-lg'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                  <span className="bg-primary border-3 border-black rounded-full px-6 py-1.5 text-sm font-bold text-black shadow-[3px_3px_0px_#0A0A0A] whitespace-nowrap">
                    ⭐ Most Popular
                  </span>
                </div>
              )}

              <div className={`absolute top-0 left-0 right-0 h-2 ${plan.accentColor} rounded-t-lg`} />

              <CardHeader className="pb-2 pt-8">
                <div className="flex items-center gap-4 mb-4">
                  <img src={plan.icon} alt="" className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <CardTitle className="font-display text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      {plan.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-4 pb-4 border-b-2 border-black/10">
                  <span className="font-display text-6xl font-bold text-black tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 text-lg font-medium ml-1">{plan.period}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-lg ${plan.iconBg} border-2 ${plan.iconBorder} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full border-3 border-black font-bold text-base py-6 transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-black text-white hover:bg-gray-800 shadow-[4px_4px_0px_#0A0A0A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0A0A0A]'
                      : 'shadow-[3px_3px_0px_#0A0A0A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#0A0A0A]'
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
