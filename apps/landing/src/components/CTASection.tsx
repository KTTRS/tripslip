import { Button } from '@tripslip/ui'

export default function CTASection() {
  return (
    <section className="bg-primary py-20 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-4xl font-bold text-black sm:text-5xl">
          Ready to simplify your field trips?
        </h2>
        <p className="mt-6 text-lg text-black/80">
          Join hundreds of teachers who have already made the switch to digital permission slips.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button 
            size="lg"
            className="bg-black text-white hover:bg-gray-800 shadow-offset hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            onClick={() => window.location.href = '/pricing'}
          >
            Get Started Free
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-2 border-black bg-white hover:bg-gray-50"
            onClick={() => window.location.href = '/apps'}
          >
            Schedule Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
