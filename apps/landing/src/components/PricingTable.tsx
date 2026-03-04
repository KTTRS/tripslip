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
      'Email notifications',
      'Basic reporting'
    ],
    cta: 'Start Free',
    highlighted: false
  },
  {
    name: 'School',
    price: '$99',
    period: '/month',
    description: 'For schools and districts',
    features: [
      'Everything in Teacher',
      'Unlimited teachers',
      'School dashboard',
      'Advanced analytics',
      'Priority support',
      'Custom branding'
    ],
    cta: 'Start Trial',
    highlighted: true
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
      'Webhook integrations',
      'Dedicated account manager'
    ],
    cta: 'Contact Sales',
    highlighted: false
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
    <section className="bg-white py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black sm:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that works for you
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`border-2 border-black ${
                plan.highlighted 
                  ? 'shadow-offset-lg bg-primary/5 scale-105' 
                  : 'shadow-offset'
              }`}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-black">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-600">{plan.period}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-primary text-xl">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
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
