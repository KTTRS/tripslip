import { ClayIcon } from '@tripslip/ui'

export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ClayIcon size="sm" color="yellow">
                <span className="text-black font-bold text-sm relative z-[2]">T</span>
              </ClayIcon>
              <h3 className="font-bold text-xl">TripSlip</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Making field trips simple, paperless, and delightful for teachers, parents, and venues.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <ClayIcon size="sm" color="sky">
                <img src="/images/icon-bus.png" alt="" />
              </ClayIcon>
              <ClayIcon size="sm" color="orange">
                <img src="/images/icon-backpack.png" alt="" />
              </ClayIcon>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-primary">Product</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="/apps" className="hover:text-white transition-colors">Apps</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-primary">Get Started</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="/teacher/" className="hover:text-white transition-colors">For Teachers</a></li>
              <li><a href="/venue/" className="hover:text-white transition-colors">For Venues</a></li>
              <li><a href="/school/" className="hover:text-white transition-colors">For Schools</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-primary">Support</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="mailto:hello@tripslip.com" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="/apps" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; 2026 TripSlip. All rights reserved.</p>
          <p className="text-xs text-gray-600">Built with care for educators everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
