export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-bold text-lg mb-4">TripSlip</h3>
            <p className="text-sm text-gray-600">
              Making field trips simple for teachers, parents, and venues.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/pricing" className="hover:text-black">Pricing</a></li>
              <li><a href="/#features" className="hover:text-black">Features</a></li>
              <li><a href="/apps" className="hover:text-black">Apps</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Get Started</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/teacher/" className="hover:text-black">For Teachers</a></li>
              <li><a href="/venue/" className="hover:text-black">For Venues</a></li>
              <li><a href="/school/" className="hover:text-black">For Schools</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="mailto:hello@tripslip.com" className="hover:text-black">Contact Us</a></li>
              <li><a href="/apps" className="hover:text-black">Help Center</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>&copy; 2026 TripSlip. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
