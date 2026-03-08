import { Button } from '@tripslip/ui'

export default function CTASection() {
  return (
    <section className="relative bg-primary py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
      <div className="absolute top-6 left-6 animate-float opacity-80">
        <img src="/images/icon-backpack.png" alt="" className="w-24 h-24 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
      </div>
      <div className="absolute bottom-6 right-10 animate-float-delayed opacity-80">
        <img src="/images/icon-bus.png" alt="" className="w-24 h-24 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
      </div>
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 opacity-10">
        <div className="w-64 h-64 rounded-full border-[8px] border-black" />
      </div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 opacity-10">
        <div className="w-48 h-48 rounded-full border-[8px] border-black" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center z-10">
        <h2 className="font-display text-3xl font-bold text-black sm:text-5xl lg:text-6xl">
          Ready to ditch
          <br />the permission slip pile?
        </h2>
        <p className="mt-6 text-xl text-black/70 max-w-2xl mx-auto">
          Join the growing community of teachers who have eliminated paperwork
          and made field trips actually fun to organize.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            size="lg"
            className="bg-black text-white hover:bg-gray-900 shadow-offset hover:-translate-x-1 hover:-translate-y-1 hover:shadow-offset-lg transition-all text-lg px-8 py-6 border-2 border-black"
            onClick={() => window.location.href = '/pricing'}
          >
            Get Started Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-black bg-white hover:bg-gray-50 text-lg px-8 py-6"
            onClick={() => window.location.href = '/apps'}
          >
            Explore the Platform
          </Button>
        </div>
        <p className="mt-6 text-sm text-black/50">
          Free for teachers. No credit card required. Set up in under 5 minutes.
        </p>
      </div>
    </section>
  )
}
