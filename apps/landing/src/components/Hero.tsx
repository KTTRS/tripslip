import { Button } from '@tripslip/ui'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-black sm:text-6xl lg:text-7xl">
              Field trips made{' '}
              <span className="text-primary">simple</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-700">
              Digital permission slips, instant payments, and real-time parent communication. 
              Everything you need to organize amazing field trips.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Button 
                size="lg" 
                className="shadow-offset hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                onClick={() => window.location.href = '/pricing'}
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-black"
              >
                Watch Demo
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-8">
              <div>
                <p className="text-3xl font-bold text-black">10K+</p>
                <p className="text-sm text-gray-600">Permission slips sent</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-black">500+</p>
                <p className="text-sm text-gray-600">Schools using TripSlip</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-black">98%</p>
                <p className="text-sm text-gray-600">Parent satisfaction</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-primary/10 border-4 border-black shadow-offset-lg p-8">
              <div className="h-full w-full rounded-xl bg-white border-2 border-black p-6 flex items-center justify-center">
                <p className="text-center text-gray-500 font-mono">
                  [Hero Image Placeholder]
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
